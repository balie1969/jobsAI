"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Job } from "@/lib/db";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobDetailsSheet } from "./job-details-sheet";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CheckCircle2, XCircle } from "lucide-react";
import { getScoreColorClass } from "@/lib/utils";

interface JobTableProps {
    initialJobs: Job[];
    currentScore: number;
    currentTimeframe: string;
}

export function JobTable({ initialJobs, currentScore, currentTimeframe }: JobTableProps) {
    const router = useRouter();
    const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof Job; direction: "asc" | "desc" }>({
        key: "matchscore",
        direction: "desc",
    });

    // Sync selectedJob with initialJobs when data revalidates (e.g. after Mark as Applied)
    React.useEffect(() => {
        if (selectedJob) {
            const updatedJob = initialJobs.find(j => j.finn_id === selectedJob.finn_id);
            // Only update if the object reference is different to avoid loops/unnecessary renders,
            // though typically reference will change on re-render.
            if (updatedJob && updatedJob !== selectedJob) {
                setSelectedJob(updatedJob);
            }
        }
    }, [initialJobs, selectedJob]);

    const handleScoreChange = (value: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set("score", value);
        router.push(`/dashboard?${params.toString()}`);
    };

    const handleTimeframeChange = (value: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set("timeframe", value);
        router.push(`/dashboard?${params.toString()}`);
    };

    const isNotRelevant = (date: string | Date | null) => {
        if (!date) return false;
        const d = new Date(date);
        return d.getFullYear() === 1900;
    };

    const handleSort = (key: keyof Job) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
        }));
    };

    const getSortedJobs = (jobs: Job[]) => {
        return [...jobs].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === null && bValue === null) return 0;
            if (aValue === null) return 1;
            if (bValue === null) return -1;

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    };

    const filteredJobs = getSortedJobs(
        initialJobs.filter(job => {
            if (statusFilter === "all") return true;
            if (statusFilter === "usokte") return !job.applied_for;
            if (statusFilter === "sokte") return job.applied_for && !isNotRelevant(job.applied_for);
            if (statusFilter === "ikke_relevante") return job.applied_for && isNotRelevant(job.applied_for);
            return true;
        })
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex gap-4">
                    <div className="flex flex-col space-y-1.5">
                        <span className="text-sm font-medium">Minimum Score:</span>
                        <Select
                            defaultValue={currentScore.toString()}
                            onValueChange={handleScoreChange}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Select score" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 21 }, (_, i) => i * 5).map((score) => (
                                    <SelectItem key={score} value={score.toString()}>
                                        {score}%
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                        <span className="text-sm font-medium">Status:</span>
                        <Select
                            defaultValue="all"
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Velg status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle jobber</SelectItem>
                                <SelectItem value="usokte">Usøkte</SelectItem>
                                <SelectItem value="sokte">Søkte</SelectItem>
                                <SelectItem value="ikke_relevante">Ikke relevante</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                        <span className="text-sm font-medium">Visning:</span>
                        <Select
                            defaultValue={currentTimeframe}
                            onValueChange={handleTimeframeChange}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Velg visning" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle</SelectItem>
                                {Array.from({ length: 7 }, (_, i) => i + 1).map((days) => (
                                    <SelectItem key={days} value={`${days}d`}>
                                        Siste {days} døgn
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground mr-2">
                    <span>
                        <span className="font-semibold text-foreground">{initialJobs.length}</span> totalt
                    </span>
                    <span>
                        <span className="font-semibold text-foreground">{filteredJobs.length}</span> vist
                    </span>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead
                                className="w-[100px] font-bold cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort("matchscore")}
                            >
                                Score {sortConfig.key === "matchscore" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                            </TableHead>
                            <TableHead
                                className="font-bold cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort("frist")}
                            >
                                Frist {sortConfig.key === "frist" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                            </TableHead>
                            <TableHead
                                className="font-bold cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort("company")}
                            >
                                Selskap <span className="font-normal text-muted-foreground">(klikk kolonne for sortering)</span> {sortConfig.key === "company" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                            </TableHead>
                            <TableHead
                                className="font-bold cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort("job_title")}
                            >
                                Tittel {sortConfig.key === "job_title" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                            </TableHead>
                            <TableHead className="font-bold">Status</TableHead>

                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredJobs.map((job) => (
                            <TableRow
                                key={job.finn_id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setSelectedJob(job)}
                            >
                                <TableCell className="font-medium">
                                    <ScoreBadge score={job.matchscore} />
                                </TableCell>
                                <TableCell>
                                    {job.frist
                                        ? format(new Date(job.frist), "d. MMM yyyy", { locale: nb })
                                        : "Snarest"}
                                </TableCell>
                                <TableCell>{job.company}</TableCell>
                                <TableCell>{job.job_title}</TableCell>
                                <TableCell>
                                    {job.applied_for && (
                                        job.applied_for.toString().startsWith("1900-01-01") || new Date(job.applied_for).getFullYear() === 1900 ? (
                                            <Badge variant="outline" className="text-red-600 border-red-600 whitespace-nowrap">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Ikke relevant
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-green-600 border-green-600 whitespace-nowrap">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Søkt: {format(new Date(job.applied_for), "yyyy-MM-dd")}
                                            </Badge>
                                        )
                                    )}
                                </TableCell>

                            </TableRow>
                        ))}
                        {filteredJobs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Ingen jobber funnet med valgt filter.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <JobDetailsSheet
                job={selectedJob}
                open={!!selectedJob}
                onOpenChange={(open: boolean) => !open && setSelectedJob(null)}
            />
        </div>
    );
}

function ScoreBadge({ score }: { score: number }) {
    const className = getScoreColorClass(score);
    return <Badge className={className}>{score}%</Badge>;
}
