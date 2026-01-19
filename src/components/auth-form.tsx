"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { loginAction, registerAction, forgotPasswordAction } from "@/app/auth-actions"; // We need to create these actions

export function AuthForm() {
    const [view, setView] = useState<"login" | "register" | "forgot_password">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setIsLoading(true);

        try {
            if (view === "login") {
                const res = await loginAction(email, password);
                if (res?.error) {
                    setError(res.error);
                    setIsLoading(false);
                }
            } else if (view === "register") {
                const res = await registerAction(email, password);
                if (res?.error) setError(res.error);
                else {
                    setMessage("Konto opprettet! Logger deg inn...");
                }
                setIsLoading(false);
            } else if (view === "forgot_password") {
                const res = await forgotPasswordAction(email);
                if (res?.error) {
                    setError(res.error);
                } else {
                    setMessage(`Hvis en konto finnes for ${email}, har vi sendt en tilbakestillingslenke. (Sjekk innboks/spam)`);
                }
                setIsLoading(false);
            }
        } catch (err) {
            setError("En uventet feil oppstod");
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        switch (view) {
            case "login": return "Velkommen tilbake";
            case "register": return "Opprett konto";
            case "forgot_password": return "Tilbakestill passord";
        }
    };

    const getDescription = () => {
        switch (view) {
            case "login": return "Logg inn for å se dine matchede jobber.";
            case "register": return "Registrer deg for å komme i gang.";
            case "forgot_password": return "Skriv inn e-posten din for å motta en lenke.";
        }
    };

    const getButtonText = () => {
        if (isLoading) return "Laster...";
        switch (view) {
            case "login": return "Logg inn";
            case "register": return "Registrer";
            case "forgot_password": return "Send tilbakestillingslenke";
        }
    };

    return (
        <Card className="w-[350px] shadow-lg bg-card/95 backdrop-blur">
            <CardHeader>
                <CardTitle>{getTitle()}</CardTitle>
                <CardDescription>{getDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="email">E-post</Label>
                            <Input
                                id="email"
                                placeholder="din@epost.no"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {view !== "forgot_password" && (
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Passord</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                    </div>
                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                    {message && <p className="text-sm text-green-500 mt-2">{message}</p>}

                    <div className="flex justify-between mt-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {getButtonText()}
                        </Button>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                {view === "login" && (
                    <>
                        <Button variant="link" className="text-xs text-muted-foreground" onClick={() => setView("register")}>
                            Ingen konto? Registrer deg
                        </Button>
                        <Button variant="link" className="text-xs text-muted-foreground p-0 h-auto" onClick={() => setView("forgot_password")}>
                            Glemt passord?
                        </Button>
                    </>
                )}
                {view === "register" && (
                    <Button variant="link" className="text-xs text-muted-foreground" onClick={() => setView("login")}>
                        Har du konto? Logg inn
                    </Button>
                )}
                {view === "forgot_password" && (
                    <Button variant="link" className="text-xs text-muted-foreground" onClick={() => setView("login")}>
                        Tilbake til innlogging
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
