"use server";

import { createUser, getUserByEmail } from "@/lib/db";
import { login } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function registerAction(email: string, password: string) {
    // Check if user exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        return { error: "User already exists" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    try {
        const newUser = await createUser(email, passwordHash);

        // Login
        // Note: We use newUser.user_id as the session identifier based on user request ("Jobs skal kun tilhøre brukeren med user_id")
        // We cast to string if needed, or keep as number depending on handle logic
        await login(newUser.user_id.toString(), newUser.id);
    } catch (e) {
        console.error("Registration error:", e);
        return { error: "Failed to create user" };
    }

    redirect("/dashboard");
}

export async function loginAction(email: string, password: string) {
    const user = await getUserByEmail(email);
    if (!user || !user.password_hash) {
        return { error: "Invalid credentials" };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        return { error: "Invalid credentials" };
    }

    // Create session
    await login(user.user_id.toString(), user.id);

    redirect("/dashboard");
}

import { encrypt, decrypt } from "@/lib/auth"; // We reuse encrypt/decrypt from auth lib which uses HS256
import { updatePassword } from "@/lib/db";

export async function forgotPasswordAction(email: string) {
    const user = await getUserByEmail(email);
    if (!user) {
        return { success: true };
    }

    // Generate a reset token valid for 1 hour
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const token = await encrypt({ email, type: 'reset', expires });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    try {
        const data = await resend.emails.send({
            from: 'AI Job Board <no-reply@jobs.beautifulnorway.info>',
            to: email,
            subject: 'Tilbakestill passord',
            html: `<p>Du har bedt om å tilbakestille passordet ditt.</p><p>Klikk her for å lage nytt passord: <a href="${resetLink}">${resetLink}</a></p><p>Linken er gyldig i 1 time.</p>`
        });
        console.log("Email sent to:", email);
        return { success: true };
    } catch (error) {
        console.error("Resend error:", error);
        return { error: "Kunne ikke sende e-post." };
    }
}

export async function resetPasswordAction(token: string, password: string) {
    try {
        const payload = await decrypt(token);
        if (!payload || payload.type !== 'reset') {
            return { error: "Ugyldig eller utløpt lenke." };
        }

        // decrypt verifies expiration automatically if "exp" claim is set, 
        // but our encrypt function in auth.ts sets "exp" to 24h by default if we use that specific helper.
        // Let's check the expires field we manually added to payload if needed, 
        // OR we can trust the encrypt/decrypt if we modify it to accept expiration.
        // The current encrypt function hardcodes 24h. 
        // For verify, we should check our custom expires field if we want shorter duration,
        // or just accept 24h as "good enough" for MVP. 
        // Let's check our custom expires date.

        if (new Date(payload.expires) < new Date()) {
            return { error: "Lenken har utløpt." };
        }

        const email = payload.email as string;

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update DB
        await updatePassword(email, passwordHash);

        return { success: true };
    } catch (e) {
        console.error("Reset password error:", e);
        return { error: "Kunne ikke tilbakestille passordet. Prøv igjen." };
    }
}
