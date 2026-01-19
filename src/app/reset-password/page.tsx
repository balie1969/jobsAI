"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/app/auth-actions";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (password !== confirmPassword) {
            setError("Passordene er ikke like.");
            return;
        }

        if (!token) {
            setError("Ugyldig lenke.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await resetPasswordAction(token, password);
            if (res?.error) {
                setError(res.error);
            } else {
                setMessage("Passordet er oppdatert! Sender deg til innlogging...");
                setTimeout(() => {
                    router.push("/");
                }, 2000);
            }
        } catch (err) {
            setError("Noe gikk galt.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Feil</CardTitle>
                    <CardDescription>Manglende token i lenken.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-[350px] shadow-lg bg-card/95 backdrop-blur">
            <CardHeader>
                <CardTitle>Nytt passord</CardTitle>
                <CardDescription>Skriv inn ditt nye passord nedenfor.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="password">Nytt passord</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="confirmPassword">Bekreft passord</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                    {message && <p className="text-sm text-green-500 mt-2">{message}</p>}

                    <div className="flex justify-between mt-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? "Oppdaterer..." : "Lagre nytt passord"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-400/20 blur-3xl" />

            <Suspense fallback={<div>Laster...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
