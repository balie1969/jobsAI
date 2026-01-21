"use server";

import { getSession } from "@/lib/auth";
import { addUserSearch, getUserSearches, deleteUserSearch, updateSearchStatus, checkJobExistsForUser } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSearchesAction() {
    const session = await getSession();
    if (!session) return [];
    return await getUserSearches(session.internalId);
}

export async function saveSearchAction(formData: FormData) {
    const session = await getSession();
    if (!session) {
        return { success: false, error: "Ikke innlogget" };
    }

    const focus = formData.get("focus") as string;
    // q_param is deprecated/handled by n8n, defaulting to empty string
    const qParam = "";
    const url = formData.get("url") as string;

    if (!focus || !url) {
        return { success: false, error: "Mangler obligatoriske felt" };
    }

    try {
        const newSearch = await addUserSearch(session.internalId, focus, qParam, url);
        revalidatePath("/dashboard");

        // Trigger n8n webhook to start analysis for this new search
        // We reuse the Manual Job Token/URL as requested by user
        if (N8N_NEW_SEARCH_URL && N8N_MANUAL_JOB_TOKEN) {
            console.log("Triggering search analysis webhook for search:", newSearch.id);

            // Wait 1s to ensure DB transaction is fully propagated/visible to external n8n
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Fire and forget, but log error
            fetch(N8N_NEW_SEARCH_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "HeaderAuthWeebHook": N8N_MANUAL_JOB_TOKEN
                },
                body: JSON.stringify({
                    user_id: session.userId,
                    search_id: newSearch.id,
                    url: newSearch.url,     // Redundant data for robustness
                    q_param: newSearch.q_param,
                    focus: newSearch.focus,
                    action: "new_search"
                })
            }).catch(e => console.error("Failed to trigger search webhook:", e));
        }

        return { success: true };
    } catch (error) {
        console.error("Error saving search:", error);
        return { success: false, error: "Kunne ikke lagre søk" };
    }
}

export async function deleteSearchAction(searchId: number) {
    const session = await getSession();
    if (!session) {
        return { success: false, error: "Ikke innlogget" };
    }

    try {
        await deleteUserSearch(session.internalId, searchId);
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error deleting search:", error);
        return { success: false, error: "Kunne ikke slette søk" };
    }
}

export async function toggleSearchStatusAction(searchId: number, aktiv: boolean) {
    const session = await getSession();
    if (!session) {
        return { success: false, error: "Ikke innlogget" };
    }

    try {
        await updateSearchStatus(session.internalId, searchId, aktiv);
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error toggling search status:", error);
        return { success: false, error: "Kunne ikke endre status" };
    }
}


// --- Manual Job Analysis ---

const N8N_MANUAL_JOB_URL = process.env.N8N_MANUAL_JOB_URL;
const N8N_MANUAL_JOB_TOKEN = process.env.N8N_MANUAL_JOB_TOKEN;
const N8N_NEW_SEARCH_URL = process.env.N8N_NEW_SEARCH_URL;

export async function triggerManualJobAnalysisAction(url: string) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return { success: false, error: "Ikke logget inn" };
        }

        // 1. Validate and extract Job ID
        if (!url.includes("finn.no")) {
            return { success: false, error: "Må være en gyldig finn.no lenke" };
        }


        // Extract ID: look for digits at end or after /ad/
        const match = url.match(/(\d{8,})/);
        const jobId = match ? match[1] : null;

        if (!jobId) {
            return { success: false, error: "Klarte ikke finne Finn-kode i lenken" };
        }

        // Check if job already analyzed/exists for user
        const exists = await checkJobExistsForUser(session.internalId, parseInt(jobId));
        if (exists) {
            return { success: false, error: "Denne jobben er allerede analysert for deg." };
        }

        if (!N8N_MANUAL_JOB_URL || !N8N_MANUAL_JOB_TOKEN) {
            console.error("Missing N8N env vars");
            return { success: false, error: "Server-konfigurasjon mangler" };
        }

        // 2. Prepare Payload
        const payload = {
            user_id: session.userId, // Logical User ID
            search_id: 999999,
            original_url: url,
            job_id: jobId
        };

        console.log("Triggering manual analysis for:", payload);

        // 3. Send Webhook
        const response = await fetch(N8N_MANUAL_JOB_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "HeaderAuthWeebHook": N8N_MANUAL_JOB_TOKEN
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("N8N Webhook failed:", response.status, text);
            return { success: false, error: `Feil fra analyseserver: ${response.statusText}` };
        }

        return { success: true };

    } catch (error: any) {
        console.error("Manual analysis error:", error);
        return { success: false, error: error.message || "Ukjent feil" };
    }
}
