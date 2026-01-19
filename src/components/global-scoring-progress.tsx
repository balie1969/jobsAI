"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { getGlobalScoringStatsAction } from "@/app/admin-actions";

export function GlobalScoringProgress() {
    const [stats, setStats] = useState<{ total: number; completed: number } | null>(null);

    const fetchStats = async () => {
        try {
            const res = await getGlobalScoringStatsAction();
            if (res.success && res.stats) {
                setStats(res.stats);
            }
        } catch (error) {
            console.error("Failed to fetch global stats", error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchStats();

        // Poll every 3 seconds
        const interval = setInterval(fetchStats, 3000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return <div className="text-xs text-muted-foreground">Laster statistikk...</div>;

    const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
        <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Global Fremgang</span>
                <span>{percentage}% ({stats.completed} / {stats.total})</span>
            </div>
            <Progress value={percentage} className="h-2 bg-slate-200" />
            <p className="text-[10px] text-muted-foreground text-right">Oppdateres automatisk</p>
        </div>
    );
}
