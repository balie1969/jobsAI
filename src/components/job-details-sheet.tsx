"use client";

import * as React from "react";
import { useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Job } from "@/lib/db";
import { CheckCircle2, XCircle, Briefcase, Printer } from "lucide-react";
import { markAsAppliedAction, markAsNotRelevantAction } from "@/app/actions";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { getScoreColorClass } from "@/lib/utils";

interface JobDetailsSheetProps {
    job: Job | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function JobDetailsSheet({
    job,
    open,
    onOpenChange,
}: JobDetailsSheetProps) {
    const [isPending, startTransition] = useTransition();
    const [showCopied, setShowCopied] = React.useState(false);

    if (!job) return null;

    const handleMarkAsApplied = () => {
        startTransition(async () => {
            await markAsAppliedAction(job.finn_id);
        });
    };

    const handleMarkAsNotRelevant = () => {
        startTransition(async () => {
            await markAsNotRelevantAction(job.finn_id);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogDescription className="text-3xl font-bold text-foreground hover:underline cursor-pointer">
                        {job.company}
                    </DialogDescription>
                    <DialogTitle className="text-xl text-muted-foreground font-normal">{job.job_title}</DialogTitle>
                    <div className="text-xl text-muted-foreground font-normal">
                        Frist: {job.frist
                            ? format(new Date(job.frist), "d. MMM yyyy", { locale: nb })
                            : "Snarest"}
                    </div>
                    <div
                        className="text-sm text-blue-500 hover:text-blue-700 cursor-pointer mt-1 select-none"
                        onClick={() => {
                            if (job.job_url) {
                                navigator.clipboard.writeText(job.job_url);
                                setShowCopied(true);
                                setTimeout(() => setShowCopied(false), 1000);
                            }
                        }}
                        title="Trykk for å kopiere linken"
                    >
                        {job.job_url}
                        <span className="text-gray-500 text-xs ml-2">
                            {showCopied ? (
                                <span className="text-green-600 font-medium">Lenke kopiert!</span>
                            ) : (
                                "(Trykk for å kopiere linken)"
                            )}
                        </span>
                    </div>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {/* Action Button */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                        {job.applied_for ? (
                            job.applied_for.toString().startsWith("1900-01-01") || new Date(job.applied_for).getFullYear() === 1900 ? (
                                <Badge variant="outline" className="text-red-600 border-red-600 px-3 py-1">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Ikke relevant
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Søkt den {format(new Date(job.applied_for), "d. MMM yyyy", { locale: nb })}
                                </Badge>
                            )
                        ) : (
                            <>
                                <Button variant="destructive" onClick={handleMarkAsNotRelevant} disabled={isPending}>
                                    {isPending ? "..." : "Ikke relevant"}
                                    <XCircle className="ml-2 w-4 h-4" />
                                </Button>
                                <Button onClick={handleMarkAsApplied} disabled={isPending}>
                                    {isPending ? "Lagrer..." : "Merk som søkt"}
                                    <Briefcase className="ml-2 w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Match Score Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Match Score</h3>
                            <Badge className={`text-base px-3 py-1 ${getScoreColorClass(job.matchscore)}`}>
                                {job.matchscore}% Match
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pros */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-green-600 flex items-center">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Pros
                                </h4>
                                <ul className="text-sm space-y-1 list-disc pl-4">
                                    {[job.yes_1, job.yes_2, job.yes_3, job.yes_4, job.yes_5]
                                        .filter(Boolean)
                                        .map((reason, i) => (
                                            <li key={i}>{reason}</li>
                                        ))}
                                </ul>
                            </div>

                            {/* Cons */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-red-600 flex items-center">
                                    <XCircle className="w-4 h-4 mr-2" /> Cons
                                </h4>
                                <ul className="text-sm space-y-1 list-disc pl-4">
                                    {[job.no_1, job.no_2, job.no_3, job.no_4, job.no_5]
                                        .filter(Boolean)
                                        .map((reason, i) => (
                                            <li key={i}>{reason}</li>
                                        ))}
                                </ul>
                            </div>
                        </div>

                        {/* Recommendation */}
                        {job.recommend_apply && (
                            <div className="bg-muted p-4 rounded-md mt-2 border">
                                <span className="font-semibold block mb-1">Recommendation: </span>
                                {job.recommend_apply}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Contact Info */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Contact Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {(job.contact1_name || job.contact1_phone) && (
                                <div className="text-sm border p-3 rounded-md">
                                    <p className="font-medium text-base">{job.contact1_name || "Contact 1"}</p>
                                    <p className="text-muted-foreground">{job.contact1_title}</p>
                                    {job.contact1_phone && <p className="mt-1">{job.contact1_phone}</p>}
                                </div>
                            )}
                            {(job.contact2_name || job.contact2_phone) && (
                                <div className="text-sm border p-3 rounded-md">
                                    <p className="font-medium text-base">{job.contact2_name || "Contact 2"}</p>
                                    <p className="text-muted-foreground">{job.contact2_title}</p>
                                    {job.contact2_phone && <p className="mt-1">{job.contact2_phone}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Job Description (HTML) */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Job Description</h3>
                        <div
                            className="prose prose-sm max-w-none dark:prose-invert border p-4 rounded-md bg-card"
                            dangerouslySetInnerHTML={{ __html: job.job_text_html }}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
