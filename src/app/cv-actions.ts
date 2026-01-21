"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { uploadUserCV, getUserCVs, setPrimaryCV, deleteUserCV, UserCV, getUserInternal } from "@/lib/db";
import fs from "fs";
import path from "path";
import PDFParser from "pdf2json"; // Top-level import to ensure bundling

function logDebug(message: string, data?: any) {
    // Write to console so it shows up in docker logs
    console.log(`[CV-UPLOAD] ${message}`, data ? JSON.stringify(data) : '');
}

export async function uploadCVAction(formData: FormData) {
    console.log("SERVER: uploadCVAction called!");
    logDebug("uploadCVAction started");

    // Test direct return to verify connection
    // return { success: true }; 

    try {
        const session = await getSession();
        logDebug("Session check", { userId: session?.userId });

        if (!session || !session.userId) return { error: "Du er ikke innlogget" };

        const file = formData.get("file") as File;
        if (!file) {
            logDebug("No file provided");
            return { error: "Ingen fil valgt" };
        }

        logDebug("File received", { name: file.name, type: file.type, size: file.size });

        if (file.type !== "application/pdf") {
            return { error: "Kun PDF-filer er tillatt" };
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. Save file to disk
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize
        const savedFilename = `${uniqueSuffix}-${filename}`;

        // Use public/uploads which is mounted to a volume in Docker
        const uploadDir = path.resolve(process.cwd(), "public", "uploads");

        if (!fs.existsSync(uploadDir)) {
            // This might throw if permissions are bad, but we catch it below
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, savedFilename);
        logDebug("Saving file to", filePath);
        fs.writeFileSync(filePath, buffer);
        logDebug("File saved successfully");

        // 2. Extract text using pdf2json
        let text = "";

        logDebug("Starting PDF parsing for text extraction");

        try {
            const pdfParser = new PDFParser(null, true); // true = raw text enable

            text = await new Promise<string>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error("PDF parsing timed out after 10s"));
                }, 10000);

                pdfParser.on("pdfParser_dataError", (errData: any) => {
                    clearTimeout(timeout);
                    logDebug("pdfParser error", errData);
                    // Don't fail the whole upload if parsing fails, just log it
                    // reject(errData.parserError); 
                    resolve("");
                });

                pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                    clearTimeout(timeout);
                    logDebug("pdfParser ready");
                    try {
                        let extractedText = "";

                        // pdf2json returns an object with Pages -> Texts -> R -> T (text encoded)
                        if (pdfData && pdfData.Pages) {
                            pdfData.Pages.forEach((page: any) => {
                                if (page.Texts) {
                                    page.Texts.forEach((textItem: any) => {
                                        if (textItem.R) {
                                            textItem.R.forEach((r: any) => {
                                                if (r.T) {
                                                    try {
                                                        extractedText += decodeURIComponent(r.T) + " ";
                                                    } catch (decodeErr) {
                                                        extractedText += r.T + " ";
                                                    }
                                                }
                                            });
                                        }
                                    });
                                    extractedText += "\n";
                                }
                            });
                        }

                        resolve(extractedText.trim());
                    } catch (e: any) {
                        logDebug("Text extraction failed", e.message);
                        resolve("");
                    }
                });

                try {
                    pdfParser.parseBuffer(buffer);
                } catch (e) {
                    clearTimeout(timeout);
                    resolve(""); // Safe fail
                }
            });
            logDebug("PDF parsed, text length:", text.length);
        } catch (parseError: any) {
            logDebug("PDF parsing failed (non-fatal)", parseError.message);
            text = "";
        }

        // 3. Save to DB
        // Use relative path for serving or full path? 
        // We save the full path for backend usage, but for serving we might need URL.
        // For now, let's keep it as is.
        logDebug("Saving to database");
        await uploadUserCV(session.internalId, {
            filename: file.name,
            file_path: filePath,
            content_type: file.type,
            file_size: file.size,
            cv_text: text,
            is_primary: false
        });

        logDebug("Database save complete");
        revalidatePath("/dashboard");
        return { success: true };

    } catch (error: any) {
        logDebug("Fatal upload error:", error.message);
        console.error("Upload error:", error);
        return { error: "Kunne ikke laste opp CV: " + (error.message || String(error)) };
    }
}

export async function getUserCVsAction() {
    try {
        const session = await getSession();
        if (!session || !session.userId) return [];

        const cvs = await getUserCVs(session.internalId);
        return cvs;
    } catch (error) {
        console.error("Failed to fetch user CVs", error);
        return [];
    }
}

const N8N_WEBHOOK_URL = "https://n8n.beautifulnorway.info/webhook/52ddb5ea-01cb-4ec2-b5d9-c12f1bf76408";

async function triggerScoringWebhook(internalId: number) {
    try {
        const user = await getUserInternal(internalId);
        if (!user) {
            console.error("Could not find user for webhook trigger");
            return;
        }

        console.log(`Triggering scoring webhook for user_id: ${user.user_id}`);

        // Fire and forget - don't await the result to block UI, but do log error if promise fails
        fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user.user_id
            }),
        }).then(res => {
            if (res.ok) console.log("Webhook triggered successfully");
            else console.error("Webhook failed:", res.statusText);
        }).catch(err => {
            console.error("Webhook error:", err);
        });

    } catch (error) {
        console.error("Error preparing webhook trigger:", error);
    }
}

export async function setPrimaryCVAction(cvId: number) {
    try {
        const session = await getSession();
        if (!session || !session.userId) return { error: "Ikke innlogget" };

        await setPrimaryCV(session.internalId, cvId);

        // Trigger re-scoring
        await triggerScoringWebhook(session.internalId);

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to set primary CV", error);
        return { error: "Kunne ikke sette primær CV" };
    }

}

export async function deleteCVAction(cvId: number) {
    try {
        const session = await getSession();
        if (!session || !session.userId) return { error: "Ikke innlogget" };

        const result = await deleteUserCV(session.internalId, cvId);

        // If the deleted CV was primary, a new one has been set (by DB logic), but matches are cleared.
        // We do NOT automatically trigger re-scoring here, to avoid "thrashing" if user intends to upload a new one.
        // User must explicitly set the new (or other) CV as primary to start scoring.
        if (result.wasPrimary) {
            console.log("Deleted primary CV. New primary set, matches cleared. Waiting for user action to trigger scoring.");
        }

        // If DB delete was successful and returned a file path, delete from disk
        if (result && result.filePath) {
            try {
                if (fs.existsSync(result.filePath)) {
                    fs.unlinkSync(result.filePath);
                }
            } catch (fsErr) {
                console.error("Failed to delete local file:", fsErr);
                // Non-fatal, DB record is gone, so for user it's "deleted"
            }
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete CV", error);
        return { error: error.message || "Kunne ikke slette CV" };
    }
}

