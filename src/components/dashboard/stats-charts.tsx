"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from "recharts";

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
    // Data for Pie Chart
    const statusData = [
        { name: "Nye / Aktive", value: stats.statusCounts.active, color: "#3b82f6" }, // Blue-500
        { name: "Søkt", value: stats.statusCounts.applied, color: "#22c55e" },       // Green-500
        { name: "Ikke aktuell", value: stats.statusCounts.notRelevant, color: "#9ca3af" }, // Gray-400
    ].filter(d => d.value > 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {/* 1. Status Overview (Donut) */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Status Oversikt</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                    {/* Add key to force re-render if data changes (e.g. initial empty vs loaded) */}
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 text-xs mt-[-20px] relative z-10">
                        {statusData.map(d => (
                            <div key={d.name} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                <span>{d.name} ({d.value})</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 2. Deadline Distribution (Bar) */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Frist Relevante (Ubehandlet)</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.deadlineStats} margin={{ left: -20, right: 10, bottom: 20 }}>
                            <XAxis dataKey="bucket" tick={{ fontSize: 10, dy: 10 }} interval={0} angle={-45} textAnchor="end" height={70} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={30}>
                                {stats.deadlineStats.map((entry, index) => {
                                    let color = "#3b82f6"; // Default Blue
                                    if (['Snarest', 'Utgått', 'I dag'].includes(entry.bucket)) color = "#ef4444"; // Red (High Urgency)
                                    if (['Denne uken'].includes(entry.bucket)) color = "#f59e0b"; // Yellow
                                    if (['Senere', 'Neste uke'].includes(entry.bucket)) color = "#10b981"; // Green
                                    return <Cell key={`cell-${index}`} fill={color} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 3. Top Searches (Bar) */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Topp Søk (Matcher &gt; 70%)</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.topSearches} layout="vertical" margin={{ left: 0, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                tick={{ fontSize: 10 }}
                                interval={0}
                            />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 4. Activity (Area) */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Nye Jobber (Siste 30 dager)</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.dailyActivity} margin={{ left: -20, right: 10 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="count" stroke="#8884d8" fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
