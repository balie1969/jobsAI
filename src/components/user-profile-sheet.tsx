"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getUserDetailsAction, saveUserDetailsAction, lookupPostalCodeAction } from "@/app/actions";
import { uploadCVAction, getUserCVsAction, setPrimaryCVAction, deleteCVAction } from "@/app/cv-actions";
import { User, UserCV } from "@/lib/db";
import { Upload, FileText, CheckCircle2, Calendar, Trash2 } from "lucide-react";
import { GlobalScoringProgress } from "@/components/global-scoring-progress";

export function UserProfileButton() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({
        fornavn: "",
        etternavn: "",
        adresse: "",
        postnr: "",
        sted: "",
        mobil: "",
    });
    const [cvs, setCvs] = useState<UserCV[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [cvToDelete, setCvToDelete] = useState<number | null>(null);
    const [alertConfig, setAlertConfig] = useState<{
        open: boolean;
        title: string;
        description: string;
        action: () => void;
        buttonText?: string;
    }>({ open: false, title: "", description: "", action: () => { } });

    // Fetch user data and CVs when dialog opens
    useEffect(() => {
        if (open) {
            setIsLoading(true);
            Promise.all([
                getUserDetailsAction(),
                getUserCVsAction()
            ]).then(([user, userCvs]) => {
                if (user) {
                    setFormData({
                        fornavn: user.fornavn || "",
                        etternavn: user.etternavn || "",
                        adresse: user.adresse || "",
                        postnr: user.postnr || "",
                        sted: user.sted || "",
                        mobil: user.mobil || "",
                        admin_user: user.admin_user || false,
                    });
                }
                if (userCvs) {
                    setCvs(userCvs);
                }
                setIsLoading(false);
            }).catch(err => {
                console.error("Failed to fetch user data:", err);
                setIsLoading(false);
            });
        }
    }, [open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handlePostalCodeBlur = async () => {
        if (formData.postnr && formData.postnr.length === 4) {
            const city = await lookupPostalCodeAction(formData.postnr);
            if (city) {
                setFormData((prev) => ({ ...prev, sted: city }));
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await saveUserDetailsAction(formData);
        setIsSaving(false);
        setOpen(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("handleFileUpload triggered");
        const file = e.target.files?.[0];
        if (!file) {
            console.log("No file selected");
            return;
        }
        console.log("File selected:", file.name, file.size, file.type);

        setIsUploading(true);
        setUploadSuccess(false);

        const formData = new FormData();
        formData.append("file", file);

        try {
            console.log("Calling uploadCVAction...");
            const result = await uploadCVAction(formData);
            console.log("uploadCVAction result:", result);

            setIsUploading(false);
            if (result.success) {
                setUploadSuccess(true);
                // Refresh CV list
                const updatedCvs = await getUserCVsAction();
                setCvs(updatedCvs);

                // Optionally clear success message after a few seconds
                setTimeout(() => setUploadSuccess(false), 3000);
            } else {
                setAlertConfig({
                    open: true,
                    title: "Feil ved opplasting",
                    description: "Kunne ikke laste opp CV: " + result.error,
                    action: () => { },
                    buttonText: "OK"
                });
            }
        } catch (error) {
            console.error("Client-side upload error:", error);
            setAlertConfig({
                open: true,
                title: "Systemfeil",
                description: "En uventet feil oppstod ved opplasting av filen. Vennligst prøv igjen senere. Detaljer: " + String(error),
                action: () => { },
                buttonText: "OK"
            });
            setIsUploading(false);
        }
    };

    const handleSetPrimary = async (cvId: number) => {
        setAlertConfig({
            open: true,
            title: "Bytte primær-CV?",
            description: "Hvis du bytter primær-CV vil alle eksisterende jobb-matcher bli nullstilt og skannet på nytt. Vil du fortsette?",
            action: async () => {
                // Optimistic update
                setCvs(prev => prev.map(cv => ({ ...cv, is_primary: cv.id === cvId })));

                try {
                    const result = await setPrimaryCVAction(cvId);
                    if (!result.success) {
                        // Revert if failed
                        alert("Kunne ikke sette som primær CV: " + result.error);
                        const currentCvs = await getUserCVsAction();
                        setCvs(currentCvs);
                    } else {
                        // Refresh to be sure
                        const updatedCvs = await getUserCVsAction();
                        setCvs(updatedCvs);
                    }
                } catch (error) {
                    console.error("Error setting primary CV:", error);
                    alert("Feil ved setting av primær CV");
                }
            }
        });
    };



    const handleDeleteCV = async (cvId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click (setting primary)

        const isPrimary = cvs.find(c => c.id === cvId)?.is_primary;
        let title = "Slette CV?";
        let description = "Er du sikker på at du vil slette denne CV-en?";

        if (isPrimary) {
            title = "Slette primær-CV?";
            description = "Advarsel: Du sletter nå din primære CV. Dette vil nullstille alle jobb-matcher! Er du helt sikker?";
        }

        setAlertConfig({
            open: true,
            title,
            description,
            action: async () => {
                // Check if last one (client side check for better UX)
                if (cvs.length <= 1) {
                    alert("Du kan ikke slette den siste CV-en. Minst én CV må være lagret.");
                    return;
                }

                setIsLoading(true);
                const result = await deleteCVAction(cvId);
                setIsLoading(false);

                if (result.success) {
                    // Update list
                    const updatedCvs = await getUserCVsAction();
                    setCvs(updatedCvs);
                } else {
                    alert(result.error || "Kunne ikke slette CV");
                }
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium hover:underline text-muted-foreground">Min konto</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto w-[90vw] sm:w-full sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Min konto</DialogTitle>
                    <DialogDescription>
                        Rediger dine personopplysninger og last opp CV.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 text-center">Laster...</div>
                ) : (
                    <div className="grid gap-6 py-4">
                        <form id="profile-form" onSubmit={handleSave} className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fornavn">Fornavn</Label>
                                    <Input id="fornavn" value={formData.fornavn} onChange={handleChange} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="etternavn">Etternavn</Label>
                                    <Input id="etternavn" value={formData.etternavn} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="adresse">Adresse</Label>
                                <Input id="adresse" value={formData.adresse} onChange={handleChange} />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="postnr">Postnr</Label>
                                    <Input
                                        id="postnr"
                                        value={formData.postnr}
                                        onChange={handleChange}
                                        onBlur={handlePostalCodeBlur}
                                        maxLength={4}
                                    />
                                </div>
                                <div className="grid gap-2 col-span-2">
                                    <Label htmlFor="sted">Sted</Label>
                                    <Input id="sted" value={formData.sted} onChange={handleChange} readOnly className="bg-muted" />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="mobil">Mobil</Label>
                                <Input id="mobil" value={formData.mobil} onChange={handleChange} />
                            </div>
                        </form>

                        <div className="border-t pt-4">
                            <p className="text-sm font-semibold text-foreground mb-4 bg-muted/50 p-3 rounded-md border text-center">
                                Du må laste opp din CV for AI matching mot stillinger.
                            </p>
                            <h3 className="text-sm font-medium mb-3">Min CV</h3>

                            {/* Upload Button */}
                            <div className="flex items-center gap-4 mb-4">
                                <Button variant="outline" className="relative cursor-pointer" type="button" disabled={isUploading}>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                    {isUploading ? (
                                        "Laster opp..."
                                    ) : uploadSuccess ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Last opp ny CV
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Last opp ny CV (PDF)
                                        </>
                                    )}
                                </Button>
                                {uploadSuccess && (
                                    <span className="text-sm text-green-600 font-medium animate-in fade-in slide-in-from-left-2">
                                        CV lastet opp!
                                    </span>
                                )}
                            </div>

                            {/* CV List */}
                            <div className="space-y-4">
                                <Label className="text-sm font-medium">Mine CV-er (Velg primær for AI-matching)</Label>
                                {cvs.length > 0 ? (
                                    <div className="grid gap-2">
                                        {cvs.map((cv) => (
                                            <div
                                                key={cv.id}
                                                className={`flex items-center justify-between p-3 rounded-md border transition-colors ${cv.is_primary ? "border-blue-500 bg-blue-50/50" : "bg-muted/50 border-transparent"
                                                    }`}
                                            >
                                                {/* Content Area - Clickable for setting primary */}
                                                <div
                                                    className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
                                                    onClick={() => !cv.is_primary && handleSetPrimary(cv.id)}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${cv.is_primary ? "border-blue-600" : "border-muted-foreground"}`}>
                                                        {cv.is_primary && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-sm font-medium truncate flex items-center gap-2">
                                                            {cv.filename}
                                                            {cv.is_primary && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Primær</span>}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Lastet opp: {new Date(cv.created_at).toLocaleDateString("no-NO", {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit"
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions Area */}
                                                {cvs.length > 1 && (
                                                    cvToDelete === cv.id ? (
                                                        <div className="flex items-center gap-1 ml-2 animate-in fade-in slide-in-from-right-5">
                                                            <span className="text-[10px] text-red-600 font-medium mr-1">Slette?</span>
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={(e) => handleDeleteCV(cv.id, e)}
                                                                type="button"
                                                                disabled={isLoading}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={(e) => { e.stopPropagation(); setCvToDelete(null); }}
                                                                type="button"
                                                                disabled={isLoading}
                                                            >
                                                                <span className="text-xs">X</span>
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 ml-2"
                                                            onClick={(e) => handleDeleteCV(cv.id, e)}
                                                            title="Slett CV"
                                                            type="button"
                                                            disabled={isLoading}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Ingen CV lastet opp enda.</p>
                                )}
                            </div>
                        </div>

                        {/* Admin Panel Section */}
                        {formData.admin_user && (
                            <div className="mt-4 p-4 bg-slate-100 rounded-md border border-slate-200">
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    🛡️ Admin Panel
                                </h3>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Trigg global scoring for alle jobber som mangler score. Dette påvirker alle brukere.
                                </p>
                                <Button
                                    type="button"
                                    variant="default"
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                                    onClick={() => {
                                        setAlertConfig({
                                            open: true,
                                            title: "Starte global scoring?",
                                            description: "Er du sikker på at du vil starte global scoring? Dette kan ta litt tid.",
                                            buttonText: "Start Scoring",
                                            action: async () => {
                                                const { triggerGlobalScoringAction } = await import("@/app/admin-actions");
                                                const res = await triggerGlobalScoringAction();

                                                // Short delay to allow dialog to close before opening result
                                                setTimeout(() => {
                                                    if (res.success) {
                                                        setAlertConfig({
                                                            open: true,
                                                            title: "Global scoring startet! 🚀",
                                                            description: "Scoring pågår i bakgrunnen. Du kan følge fremdriften i progressbaren under.",
                                                            buttonText: "OK",
                                                            action: () => { } // No-op
                                                        });
                                                    } else {
                                                        setAlertConfig({
                                                            open: true,
                                                            title: "Feil",
                                                            description: "Kunne ikke starte scoring: " + res.error,
                                                            buttonText: "Lukk",
                                                            action: () => { }
                                                        });
                                                    }
                                                }, 300);
                                            }
                                        });
                                    }}
                                >
                                    Score alle jobber ⚡
                                </Button>

                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <GlobalScoringProgress />
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-2 mt-4">
                            <DialogClose asChild>
                                <Button variant="outline" type="button">Lukk</Button>
                            </DialogClose>
                            <Button type="submit" form="profile-form" disabled={isSaving}>
                                {isSaving ? "Lagrer..." : "Lagre endringer"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>

            <AlertDialog open={alertConfig.open} onOpenChange={(open) => setAlertConfig(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertConfig.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            alertConfig.action();
                            setAlertConfig(prev => ({ ...prev, open: false }));
                        }}>
                            {alertConfig.buttonText || "Fortsett"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog >
    );
}
