"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UserSearch } from "@/lib/db";
import { getSearchesAction, saveSearchAction, deleteSearchAction, toggleSearchStatusAction, triggerManualJobAnalysisAction } from "@/app/search-actions";
import { Plus, Trash2, Search, ExternalLink, PlayCircle } from "lucide-react";

export function UserSearchesButton() {
    const [open, setOpen] = useState(false);
    const [searches, setSearches] = useState<UserSearch[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // New search form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        focus: "",
        url: "",
    });

    // Delete confirmation state
    const [searchToDelete, setSearchToDelete] = useState<number | null>(null);

    // Manual analysis state
    const [manualUrl, setManualUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Save status message
    const [saveStatusMessage, setSaveStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (open) {
            setIsLoading(true);
            getSearchesAction().then((data) => {
                setSearches(data);
                setIsLoading(false);
            });
        } else {
            // Reset state when closing
            setShowAddForm(false);
            setFormData({ focus: "", url: "" });
            setSaveStatusMessage(null);
            setStatusMessage(null);
        }
    }, [open]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveStatusMessage(null);

        const form = new FormData();
        form.append("focus", formData.focus);
        // form.append("q_param", formData.q_param); // Deprecated
        form.append("url", formData.url);

        const result = await saveSearchAction(form);

        if (result.success) {
            // Refresh list
            const updated = await getSearchesAction();
            setSearches(updated);

            // Show success message briefly before closing
            setSaveStatusMessage({ type: 'success', text: "Søket er lagret! AI-roboten starter analyse nå..." });

            setTimeout(() => {
                setShowAddForm(false);
                setFormData({ focus: "", url: "" });
                setSaveStatusMessage(null);
            }, 2500);
        } else {
            setSaveStatusMessage({ type: 'error', text: "Kunne ikke lagre søk: " + result.error });
        }
        setIsSaving(false);
    };

    const handleDeleteClick = (id: number) => {
        setSearchToDelete(id);
    };

    const confirmDeleteSearch = async () => {
        if (!searchToDelete) return;

        const result = await deleteSearchAction(searchToDelete);
        if (result.success) {
            const updated = await getSearchesAction();
            setSearches(updated);
            setSearchToDelete(null);
        } else {
            alert("Kunne ikke slette søk: " + result.error);
            setSearchToDelete(null);
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        // Optimistic update
        setSearches(searches.map(s => s.id === id ? { ...s, aktiv: !currentStatus } : s));

        const result = await toggleSearchStatusAction(id, !currentStatus);
        if (!result.success) {
            // Revert on failure
            setSearches(searches.map(s => s.id === id ? { ...s, aktiv: currentStatus } : s));
            alert("Kunne ikke endre status: " + result.error);
        }
    };
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleManualAnalysis = async () => {
        if (!manualUrl) return;
        setIsAnalyzing(true);
        setStatusMessage(null);

        const result = await triggerManualJobAnalysisAction(manualUrl);
        setIsAnalyzing(false);

        if (result.success) {
            setStatusMessage({ type: 'success', text: "Analyse startet! Resultatet vil dukke opp i dashbordet om kort tid." });
            setManualUrl("");
            // Clear success message after 5 seconds
            setTimeout(() => setStatusMessage(null), 5000);
        } else {
            setStatusMessage({ type: 'error', text: "Feil ved start av analyse: " + result.error });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium hover:underline text-muted-foreground">Mine søk</Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Mine lagrede søk</DialogTitle>
                    <DialogDescription>
                        Her kan du legge inn dine søk fra Finn.no
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* List View */}
                    {!showAddForm && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium">Anbefalte søk / Mine søk</h3>
                                <Button size="sm" onClick={() => setShowAddForm(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Legg til nytt søk
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="text-center py-4">Laster...</div>
                            ) : searches.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Ingen lagrede søk enda.
                                </p>
                            ) : (
                                <div className="border rounded-md max-h-[60vh] overflow-y-auto">
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">Aktiv</TableHead>
                                                    <TableHead>Fokus</TableHead>
                                                    <TableHead>AI-Snitt</TableHead>
                                                    <TableHead>Nye (24t)</TableHead>
                                                    <TableHead>Lenke</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {searches.map((search) => (
                                                    <TableRow key={search.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={!!search.aktiv}
                                                                onChange={() => handleToggleStatus(search.id, !!search.aktiv)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">{search.focus}</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1">
                                                                {search.avg_relevans_score && (
                                                                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-medium w-fit" title="Gjennomsnittlig Relevans-score for matcher over 70%">
                                                                        Relevans: {search.avg_relevans_score}
                                                                    </span>
                                                                )}
                                                                {search.avg_relevans_matchscore && (
                                                                    <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full font-medium w-fit" title="Gjennomsnittlig Match-score for matcher over 70%">
                                                                        Match: {search.avg_relevans_matchscore}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {search.scored_last_24h !== undefined && (
                                                                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full font-medium" title="Antall nye stillinger siste 24 timer">
                                                                    {search.scored_last_24h}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <a href={search.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1" title={search.url}>
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                                                onClick={() => handleDeleteClick(search.id)}
                                                                type="button"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden divide-y">
                                        {searches.map((search) => (
                                            <div key={search.id} className="p-4 flex flex-col gap-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={!!search.aktiv}
                                                            onChange={() => handleToggleStatus(search.id, !!search.aktiv)}
                                                        />
                                                        <span className="font-semibold text-sm">{search.focus}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <a href={search.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 p-1">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDeleteClick(search.id)}
                                                            className="text-muted-foreground hover:text-red-600 p-1"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap text-xs pl-6">
                                                    {search.scored_last_24h !== undefined && (
                                                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">
                                                            Nytt (24t): {search.scored_last_24h}
                                                        </span>
                                                    )}
                                                    {search.avg_relevans_score && (
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                                            Avg. Rel: {search.avg_relevans_score}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Manual Job Analysis Tool */}
                    {!showAddForm && (
                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 text-blue-600" />
                                Manuell Jobb-import
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Har du funnet en enkeltstilling du vil analysere? Lim inn lenken her.
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://www.finn.no/job/ad/..."
                                    value={manualUrl}
                                    onChange={(e) => setManualUrl(e.target.value)}
                                    className="flex-1"
                                />
                                <Button onClick={handleManualAnalysis} disabled={isAnalyzing || !manualUrl}>
                                    {isAnalyzing ? "Starter..." : "Analyser Stilling"}
                                </Button>
                            </div>
                            {statusMessage && (
                                <p className={`text-sm mt-3 ${statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {statusMessage.text}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Add Form */}
                    {showAddForm && (
                        <div className="bg-muted/30 p-4 rounded-lg border">
                            <h3 className="text-sm font-medium mb-4">Legg til nytt søk</h3>
                            <form onSubmit={handleSave} className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="focus">Fokus / Navn</Label>
                                    <Input
                                        id="focus"
                                        placeholder="F.eks. Data Engineering"
                                        value={formData.focus}
                                        onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                                        required
                                    />
                                </div>
                                {/* <div className="grid gap-2">
                                    <Label htmlFor="q_param">q-parameter</Label>
                                    <Input
                                        id="q_param"
                                        placeholder="F.eks. data+engineer"
                                        value={formData.q_param}
                                        onChange={(e) => setFormData({ ...formData, q_param: e.target.value })}
                                        required
                                    />
                                </div> */}
                                <div className="grid gap-2">
                                    <Label htmlFor="url">Full URL</Label>
                                    <Textarea
                                        id="url"
                                        placeholder="https://www.finn.no/job/search?..."
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        required
                                        className="font-mono text-xs"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 mt-2">
                                    {saveStatusMessage && (
                                        <div className={`p-3 rounded text-sm ${saveStatusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {saveStatusMessage.text}
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                                            Avbryt
                                        </Button>
                                        <Button type="submit" disabled={isSaving}>
                                            {isSaving ? "Lagrer..." : "Lagre søk"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {!showAddForm && (
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Lukk</Button>
                        </DialogClose>
                    </DialogFooter>
                )}
            </DialogContent>

            <AlertDialog open={!!searchToDelete} onOpenChange={(open) => !open && setSearchToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Slette søk?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Dette vil slette søket og fjerne alle usøkte stillinger knyttet til det fra dashbordet.
                            Historikk på stillinger du har søkt på eller markert som "Ikke relevant" vil bli tatt vare på.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteSearch} className="bg-red-600 hover:bg-red-700">
                            Slett søk
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog >
    );
}
