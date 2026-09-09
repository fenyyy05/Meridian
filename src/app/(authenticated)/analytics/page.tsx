import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Focus, Target, AlertTriangle } from "lucide-react";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { redirect } from 'next/navigation';

export const metadata = {
  title: "Analytics | Meridian",
  description: "Track your academic progress and productivity.",
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Fetch ProductivitySnapshot for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const snapshots = await prisma.productivitySnapshot.findMany({
    where: {
      userId: session.user.id,
      date: { gte: sevenDaysAgo },
    },
    orderBy: { date: "asc" },
  });

  // Calculate metrics
  const totalFocusTime = snapshots.reduce((acc, curr) => acc + curr.totalFocusMinutes, 0);
  const totalDistractions = snapshots.reduce((acc, curr) => acc + curr.distractionCount, 0);
  
  const totalTasksCompleted = snapshots.reduce((acc, curr) => acc + curr.tasksCompleted, 0);
  const totalTasksPostponed = snapshots.reduce((acc, curr) => acc + curr.tasksPostponed, 0);
  const completionRate = totalTasksCompleted + totalTasksPostponed > 0 
    ? Math.round((totalTasksCompleted / (totalTasksCompleted + totalTasksPostponed)) * 100) 
    : 0;

  const validScores = snapshots.filter((s) => s.avgFocusScore !== null);
  const avgFocusScore = validScores.length > 0 
    ? Math.round(validScores.reduce((acc, curr) => acc + (curr.avgFocusScore || 0), 0) / validScores.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your focus time, productivity, and trends over time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Focus Score</CardTitle>
            <Focus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFocusScore}/100</div>
            <p className="text-xs text-muted-foreground mt-1">Based on recent sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Focus Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distractions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistractions}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks completed vs postponed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AnalyticsCharts data={snapshots.map(s => ({
          date: s.date.toLocaleDateString('en-US', { weekday: 'short' }),
          focusMinutes: s.totalFocusMinutes,
          score: s.avgFocusScore || 0,
        }))} />
      </div>
    </div>
  );
}
