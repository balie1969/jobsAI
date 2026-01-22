import { getMatchedJobs, getUserById, getUserCVs, getDashboardStats } from "@/lib/db";
import { JobTable } from "@/components/job-table";
import { getSession, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserProfileButton } from "@/components/user-profile-sheet";
import { UserSearchesButton } from "@/components/user-searches-sheet";
import { ScoringProgress } from "@/components/scoring-progress";
import { StatsCharts } from "@/components/dashboard/stats-charts";
import { DashboardNotifications } from "@/components/dashboard-notifications";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ score?: string; timeframe?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const { score, timeframe } = await searchParams;
  const minScore = score ? parseInt(score, 10) : 70;
  const currentTimeframe = timeframe || "all";

  // Pass session.userId (assuming it was stored as userId in session)
  const initialJobs = await getMatchedJobs(session.userId, minScore, currentTimeframe);
  const user = await getUserById(session.userId);
  const cvs = await getUserCVs(session.internalId);
  const stats = await getDashboardStats(session.internalId, minScore, currentTimeframe);

  return (
    <div className="container mx-auto py-4 sm:py-10 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Job Match Dashboard {user?.fornavn ? `- ${user.fornavn}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Antall jobber scoret siste 24 timer: {stats.scoredLast24h || 0}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto">
          <UserSearchesButton />
          <UserProfileButton />
          <form action={async () => {
            "use server"
            await logout();
            redirect("/");
          }}>
            <Button variant="ghost" className="text-sm font-medium hover:underline text-muted-foreground">Logg ut</Button>
          </form>
        </div>
      </div>

      <DashboardNotifications user={user} cvCount={cvs.length} />
      <ScoringProgress />
      {stats && <StatsCharts stats={stats} />}
      <JobTable initialJobs={initialJobs} currentScore={minScore} currentTimeframe={currentTimeframe} />
    </div>
  );
}
