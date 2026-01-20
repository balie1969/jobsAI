"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type DeadlineBarChartProps = {
    data: {
        bucket: string;
        count: number;
    }[];
};

export default function DeadlineBarChart({ data }: DeadlineBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -20, right: 10, bottom: 20 }}>
                <XAxis dataKey="bucket" tick={{ fontSize: 10, dy: 10 }} interval={0} angle={-45} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={30}>
                    {data.map((entry, index) => {
                        let color = "#3b82f6"; // Default Blue
                        if (['Snarest', 'Utgått', 'I dag'].includes(entry.bucket)) color = "#ef4444"; // Red (High Urgency)
                        if (['Denne uken'].includes(entry.bucket)) color = "#f59e0b"; // Yellow
                        if (['Senere', 'Neste uke'].includes(entry.bucket)) color = "#10b981"; // Green
                        return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
