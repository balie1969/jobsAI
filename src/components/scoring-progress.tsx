"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { getScoringStatusAction } from "@/app/status-actions";
import { Loader2, CheckCircle2 } from "lucide-react";

export function ScoringProgress() {
    const [status, setStatus] = useState<{
        total: number;
        completed: number;
        percentage: number;
        isComplete: boolean;
        missingIds: number[];
    } | null>(null);

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const checkStatus = async () => {
            const result = await getScoringStatusAction();

            // Only show if we actually have jobs but haven't finished scoring them all
            // Also show if we just finished (to show 100% briefly)
            // Only show if we simply have activity.
            // If completed is 0, we assume scoring hasn't started yet (user deleted CV but hasn't uploaded new one).
            const shouldShow = result.total > 0 && result.completed < result.total && result.completed > 0;

            setStatus(result);

            if (shouldShow) {
                setIsVisible(true);
            } else if (result.isComplete && isVisible) {
                // If we were visible and now complete, wait a moment then hide
                setTimeout(() => setIsVisible(false), 5000);
            }
        };

        // Initial check
        checkStatus();

        // Poll every 3 seconds if visible or potentially active
        intervalId = setInterval(checkStatus, 3000);

        return () => clearInterval(intervalId);
    }, [isVisible]);

    if (!isVisible || !status) return null;

    return (
        <div className="w-full max-w-2xl mx-auto mb-6 p-4 border rounded-lg bg-card shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {status.isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    )}
                    <span className="font-medium text-sm">
                        {status.isComplete
                            ? "AI-analyse fullført"
                            : "AI analyserer stillinger..."}
                    </span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                    {status.completed}/{status.total} ({status.percentage}%)
                </span>
            </div>

            <Progress value={status.percentage} className="h-2" />

            {!status.isComplete && (
                <div className="text-xs text-muted-foreground mt-2 text-center">
                    <p>Analyserer jobber mot din primær-CV. Dette kan ta noen minutter.</p>
                    {status.missingIds && status.missingIds.length > 0 && status.missingIds.length < 5 && (
                        <p className="mt-1 text-red-500 font-mono">
                            Venter på ID: {status.missingIds.join(", ")}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
