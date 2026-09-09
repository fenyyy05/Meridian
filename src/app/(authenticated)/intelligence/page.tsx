import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { detectStruggleAreas, type TopicActivity } from "@/server/ml-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock, ShieldAlert, Target } from "lucide-react";
import { redirect } from 'next/navigation';

export const metadata = {
  title: "Intelligence Center | Meridian",
  description: "AI-powered insights for your academic productivity",
};

export default async function IntelligencePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Fetch data to construct TopicActivity
  const topics = await prisma.topic.findMany({
    where: { subject: { userId: session.user.id } },
    include: {
      subject: true,
      tasks: true,
    },
  });

  const topicActivities: TopicActivity[] = topics.map((t) => {
    const totalTasks = t.tasks.length;
    const completedTasks = t.tasks.filter((task) => task.status === "COMPLETED").length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
    
    return {
      topic_id: t.id,
      topic_name: t.name,
      subject_name: t.subject.name,
      completion_rate: completionRate,
      postpone_count: t.tasks.reduce((sum, task) => sum + task.postponedCount, 0),
      total_time_minutes: t.tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
      avg_focus_score: 80,
      confidence_level: t.confidenceLevel,
      session_count: 5,
    };
  });

  let struggleAreas = null;
  try {
    struggleAreas = await detectStruggleAreas(topicActivities);
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Intelligence Center</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered insights based on your learning patterns and productivity metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Your Productivity Windows */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Productivity Windows</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9:00 AM - 11:30 AM</div>
            <p className="text-xs text-muted-foreground mt-1">
              You are 40% more focused during morning sessions.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-[#B5C9B3] w-[80%]" />
                </div>
                <span className="text-xs font-medium">Morning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-[#A7C4D4] w-[40%]" />
                </div>
                <span className="text-xs font-medium">Afternoon</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-[#B8A9C9] w-[60%]" />
                </div>
                <span className="text-xs font-medium">Evening</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Struggle Detection */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Struggle Detection</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {struggleAreas && struggleAreas.length > 0 ? (
              <div className="space-y-4 mt-2">
                {struggleAreas.map((area, idx) => (
                  <div key={idx} className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{area.topic_name} <span className="text-muted-foreground text-sm font-normal">({area.subject_name})</span></span>
                      <span className={`text-xs px-2 py-1 rounded-full ${area.struggle_level === 'HIGH' ? 'bg-red-500/10 text-red-600' : area.struggle_level === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-green-500/10 text-green-600'}`}>
                        {area.struggle_level} Risk
                      </span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-1">
                      {area.reasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Target className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No significant struggle areas detected right now. Keep up the good work!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distraction Patterns */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distraction Risk Predictions</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4 mt-2">
              <div className="flex-1 bg-card border rounded-lg p-4 w-full">
                <h4 className="font-semibold text-sm mb-2">Social Media</h4>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 w-[75%]" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">High risk during evening sessions.</p>
              </div>
              <div className="flex-1 bg-card border rounded-lg p-4 w-full">
                <h4 className="font-semibold text-sm mb-2">Tab Switching</h4>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 w-[45%]" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Moderate risk when studying difficult topics.</p>
              </div>
              <div className="flex-1 bg-card border rounded-lg p-4 w-full">
                <h4 className="font-semibold text-sm mb-2">Phone Notifications</h4>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-[#A7C4D4] w-[20%]" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Low risk. Good job keeping your phone away.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
