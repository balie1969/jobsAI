"use server";

import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { revalidatePath } from "next/cache";

const N8N_GLOBAL_SCORING_URL = "https://n8n.beautifulnorway.info/webhook/99a0dc95-8e25-407e-b09b-8512954fc73c";

export async function triggerGlobalScoringAction() {
    const session = await getSession();
    if (!session || !session.userId) {
        return { success: false, error: "Unauthorized" };
    }

    // Double check admin status from DB
    const user = await getUserById(session.userId);
    if (!user || user.admin_user !== true) {
        console.warn(`Unauthorized global scoring attempt by user ${session.userId}`);
        return { success: false, error: "Unauthorized: Admin privileges required." };
    }

    try {
        const response = await fetch(N8N_GLOBAL_SCORING_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "HeaderAuthWeebHook": process.env.N8N_MANUAL_JOB_TOKEN || ""
            },
            body: JSON.stringify({
                triggeredBy: user.email,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Webhook failed with status ${response.status}: ${errorText}`);
            throw new Error(`Webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Global scoring Trigger Error:", error);
        return { success: false, error: error.message || "Failed to trigger scoring." };
    }
}

export async function getGlobalScoringStatsAction() {
    const session = await getSession();
    if (!session || !session.userId) {
        return { success: false, error: "Unauthorized" };
    }

    // Double check admin status from DB
    const user = await getUserById(session.userId);
    if (!user || user.admin_user !== true) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Dynamically import db to avoid circular deps if any (though usually fine here)
        const { getGlobalScoringStats } = await import("@/lib/db");
        const stats = await getGlobalScoringStats();
        return { success: true, stats };
    } catch (error) {
        console.error("Get Global Stats Error:", error);
        return { success: false, error: "Failed to get stats." };
    }
}
