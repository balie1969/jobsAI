"use server";

import { getSession } from "@/lib/auth";
import { getJobScoringStats } from "@/lib/db";

export async function getScoringStatusAction() {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return { total: 0, completed: 0, percentage: 100, isComplete: true, missingIds: [] };
        }

        const stats = await getJobScoringStats(session.internalId);

        // Avoid division by zero
        let percentage = 100;
        if (stats.total > 0) {
            percentage = Math.round((stats.completed / stats.total) * 100);
        } else {
            // No jobs means nothing to score, so "complete" in a sense, but let's hide the bar
            return { total: 0, completed: 0, percentage: 100, isComplete: true, missingIds: [] };
        }

        // Cap at 100
        if (percentage > 100) percentage = 100;

        return {
            total: stats.total,
            completed: stats.completed,
            percentage,
            isComplete: stats.completed >= stats.total && stats.total > 0,
            missingIds: stats.missingIds || []
        };
    } catch (error) {
        console.error("Error getting scoring status:", error);
        // Default to hidden/complete on error so we don't annoy user
        return { total: 0, completed: 0, percentage: 100, isComplete: true, missingIds: [] };
    }
}
