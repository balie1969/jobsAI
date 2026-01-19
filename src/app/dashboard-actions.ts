"use server";

import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/db";

export async function getDashboardStatsAction(minScore: number = 70) {
    const session = await getSession();
    if (!session || !session.internalId) {
        return null;
    }

    try {
        return await getDashboardStats(session.internalId, minScore);
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return null;
    }
}
