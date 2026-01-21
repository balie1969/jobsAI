"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";

const StatusPieChart = dynamic(() => import("@/components/dashboard/charts/status-pie-chart"), { ssr: false });
const DeadlineBarChart = dynamic(() => import("@/components/dashboard/charts/deadline-bar-chart"), { ssr: false });
const TopSearchesBarChart = dynamic(() => import("@/components/dashboard/charts/top-searches-bar-chart"), { ssr: false });
const ActivityAreaChart = dynamic(() => import("@/components/dashboard/charts/activity-area-chart"), { ssr: false });

type StatsProps = {
    stats: {
        statusCounts: {
            active: number;
            applied: number;
            notRelevant: number;
        };
        topSearches: {
            name: string;
            count: number;
        }[];
        dailyActivity: {
            day: string;
            count: number;
        }[];
        deadlineStats: {
            bucket: string;
            count: number;
        }[];
    };
};

export function StatsCharts({ stats }: StatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {/* 1. Status Overview (Donut) */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Status Oversikt</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                    <StatusPieChart counts={stats.statusCounts} />
                </CardContent>
            </Card>

            {/* 2. Deadline Distribution (Bar) */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Frist Relevante (Ubehandlet)</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                    <DeadlineBarChart data={stats.deadlineStats} />
                </CardContent>
            </Card>

            {/* 3. Top Searches (Bar) */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Topp Søk (Matcher &gt; 70%)</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                    <TopSearchesBarChart data={stats.topSearches} />
                </CardContent>
            </Card>

            {/* 4. Activity (Area) */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Nye stillinger</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                    <ActivityAreaChart data={stats.dailyActivity} />
                </CardContent>
            </Card>
        </div>
    );
}
