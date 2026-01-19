"use server";

import { markJobAsApplied, markJobAsNotRelevant, updateUser, getUserById, User } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

export async function markAsAppliedAction(jobId: number) {
    const session = await getSession();
    if (!session || !session.userId) return;

    await markJobAsApplied(session.userId, jobId);
    revalidatePath("/");
    revalidatePath("/dashboard");
}

export async function markAsNotRelevantAction(jobId: number) {
    const session = await getSession();
    if (!session || !session.userId) return;

    await markJobAsNotRelevant(session.userId, jobId);
    revalidatePath("/");
    revalidatePath("/dashboard");
}

export async function getUserDetailsAction() {
    const session = await getSession();
    if (!session || !session.userId) return null;

    try {
        const user = await getUserById(session.userId);

        // Do not return password_hash
        if (user) {
            const { password_hash, ...safeUser } = user;
            return safeUser as Partial<User>;
        }
        return null;
    } catch (error) {
        console.error("Error in getUserDetailsAction:", error);
        throw error;
    }
}

export async function saveUserDetailsAction(data: Partial<User>) {
    const session = await getSession();
    if (!session || !session.userId) return { error: "Not authenticated" };

    try {
        await updateUser(session.userId, data);
        revalidatePath("/dashboard");
        return { success: true };
    } catch (e) {
        console.error("Failed to save user details:", e);
        return { error: "Kunne ikke lagre brukerdata." };
    }
}

export async function lookupPostalCodeAction(postnr: string) {
    if (!postnr || postnr.length !== 4) return null;

    try {
        const response = await fetch(`https://ws.geonorge.no/adresser/v1/sok?postnummer=${postnr}`);
        const data = await response.json();

        if (data.adresser && data.adresser.length > 0) {
            // Return the first match's poststed (City)
            return data.adresser[0].poststed;
        }
        return null;
    } catch (e) {
        console.error("Geonorge lookup failed:", e);
        return null;
    }
}
