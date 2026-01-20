"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type StatusPieChartProps = {
    counts: {
        active: number;
        applied: number;
        notRelevant: number;
    };
};

export default function StatusPieChart({ counts }: StatusPieChartProps) {
    const statusData = [
        { name: "Nye / Aktive", value: counts.active, color: "#3b82f6" }, // Blue-500
        { name: "Søkt", value: counts.applied, color: "#22c55e" },       // Green-500
        { name: "Ikke aktuell", value: counts.notRelevant, color: "#9ca3af" }, // Gray-400
    ].filter(d => d.value > 0);

    return (
        <>
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
        </>
    );
}
