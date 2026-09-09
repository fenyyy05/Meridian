import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionStats } from '@/server/actions/sessions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TaskQuickActions } from '@/components/dashboard/TaskQuickActions'
import { QuickStartButton } from '@/components/dashboard/QuickStartButton'
import { Clock, Flame, Calendar, CheckCircle2, BrainCircuit, AlertCircle, ArrowRight, Zap, Target, BookOpen } from 'lucide-react'
import { predictDistractionRisk, detectStruggleAreas } from "@/server/ml-client"
import Link from 'next/link'

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function getRelativeDate(date: Date) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const d = new Date(date)
  if (d.toDateString() === today.toDateString()) return 'Due today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Due tomorrow'
  
  const diffTime = Math.abs(d.getTime() - today.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return `Due in ${diffDays} days`
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    stats,
    studyStreak,
    tasksDueTodayCount,
    upcomingTasks,
    recentSessionsData,
    completedTasksCount,
    totalTasksDueThisWeek,
    topics
  ] = await Promise.all([
    getSessionStats(),
    prisma.studyStreak.findUnique({ where: { userId } }),
    prisma.task.count({
      where: {
        userId,
        status: { not: 'COMPLETED' },
        deadline: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { not: 'COMPLETED' },
      },
      orderBy: [
        { priority: 'desc' },
        { deadline: 'asc' }
      ],
      take: 5,
      include: { subject: true }
    }),
    prisma.studySession.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      take: 3,
      include: { task: true }
    }),
    prisma.task.count({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.task.count({
      where: {
        userId,
        deadline: {
          gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.topic.findMany({
      where: { subject: { userId } },
      include: { subject: true, tasks: true },
      take: 10
    })
  ])

  const completionRate = totalTasksDueThisWeek > 0 
    ? Math.round((completedTasksCount / totalTasksDueThisWeek) * 100) 
    : 0

  const topicActivities = topics.map((t) => {
    const totalTasks = t.tasks.length;
    const completed = t.tasks.filter((task) => task.status === "COMPLETED").length;
    return {
      topic_id: t.id,
      topic_name: t.name,
      subject_name: t.subject.name,
      completion_rate: totalTasks > 0 ? completed / totalTasks : 0,
      postpone_count: t.tasks.reduce((sum, task) => sum + task.postponedCount, 0),
      total_time_minutes: t.tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
      avg_focus_score: 80,
      confidence_level: t.confidenceLevel,
      session_count: 5,
    };
  });

  // Gather real data for intelligence
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentSessions = await prisma.studySession.findMany({
    where: { userId, startTime: { gte: sevenDaysAgo } },
    include: { distractionEvents: true },
    orderBy: { startTime: 'desc' },
    take: 10
  })

  const recentDistractionCount = recentSessions.reduce(
    (sum, s) => sum + s.distractionEvents.length, 0
  )
  const recentDistractionDuration = recentSessions.reduce(
    (sum, s) => sum + s.distractionEvents.reduce((d, e) => d + (e.durationSeconds || 0), 0), 0
  ) / 60
  const prevSession = recentSessions[0]
  const prevFocusScore = prevSession?.focusScore ?? 75
  const prevSessionDuration = prevSession?.actualDuration ?? 25
  const avgInterruptions = recentSessions.length > 0
    ? Math.round(recentDistractionCount / recentSessions.length)
    : 0
  const postponedCount = await prisma.task.count({
    where: { userId, postponedCount: { gt: 0 } }
  })
  const historicalCompRate = totalTasksDueThisWeek > 0
    ? completedTasksCount / totalTasksDueThisWeek
    : 0.5
  const avgProductivity = recentSessions.length > 0
    ? Math.round(recentSessions.reduce((sum, s) => sum + (s.focusScore ?? 75), 0) / recentSessions.length)
    : 75

  const [risk, struggleAreas] = await Promise.all([
    predictDistractionRisk({
      hour_of_day: new Date().getHours(),
      day_of_week: new Date().getDay(),
      recent_distraction_count: recentDistractionCount,
      recent_distraction_duration_min: Math.round(recentDistractionDuration),
      prev_session_duration_min: prevSessionDuration,
      prev_focus_score: prevFocusScore,
      interruption_count: avgInterruptions,
      task_difficulty: upcomingTasks.length > 0 ? (upcomingTasks[0].difficulty || 3) : 3,
      historical_completion_rate: historicalCompRate,
      postponed_task_count: postponedCount,
      recent_productivity_score: avgProductivity,
      recent_unfinished_tasks: upcomingTasks.length,
    }),
    detectStruggleAreas(topicActivities.length > 0 ? topicActivities : [
      {
        topic_id: "dummy",
        topic_name: "General Studies",
        subject_name: "Various",
        completion_rate: 0.2,
        postpone_count: 4,
        total_time_minutes: 120,
        avg_focus_score: 70,
        confidence_level: 2,
        session_count: 5
      }
    ])
  ]);

  const topStruggle = struggleAreas && struggleAreas.length > 0 ? struggleAreas[0] : null;

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      {/* Greeting Section with beautiful gradient background */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1E2E] via-[#2A2A40] to-[#1E1E2E] p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 drop-shadow-sm">
            {getGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#B8A9C9] to-[#D4B5E5]">{session.user.name?.split(' ')[0] || 'Student'}</span>
          </h1>
          <p className="text-gray-300 font-medium opacity-90 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(new Date())}
          </p>
        </div>
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#B8A9C9] to-transparent opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 right-40 w-48 h-48 rounded-full bg-gradient-to-br from-[#A7C4D4] to-transparent opacity-10 blur-2xl"></div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-md hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A7C4D4] to-[#86ABC2]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-gray-500">Today's Focus Time</CardTitle>
            <div className="p-2 bg-[#A7C4D4]/10 rounded-full group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-[#A7C4D4]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#2D2D2D]">{formatDuration(stats.today.totalMinutes)}</div>
          </CardContent>
        </Card>
        
        <Link href="/streak">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4756A] to-[#F2948A]" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-gray-500">Study Streak</CardTitle>
              <div className="p-2 bg-[#D4756A]/10 rounded-full group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5 text-[#D4756A]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-[#2D2D2D]">{studyStreak?.currentStreak || 0} <span className="text-lg font-medium text-gray-400">days</span></div>
            </CardContent>
          </Card>
        </Link>
        
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-md hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E8C4C4] to-[#F5A9A9]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-gray-500">Tasks Due Today</CardTitle>
            <div className="p-2 bg-[#E8C4C4]/20 rounded-full group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-[#D4756A]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#2D2D2D]">{tasksDueTodayCount}</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-md hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B5C9B3] to-[#8EAD8B]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-gray-500">Completion Rate</CardTitle>
            <div className="p-2 bg-[#B5C9B3]/20 rounded-full group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5 text-[#7A9B77]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#2D2D2D]">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Intelligence Card */}
          <Link href="/intelligence">
            <Card className="border-0 bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] shadow-xl relative overflow-hidden rounded-3xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-700">
                <BrainCircuit className="w-32 h-32 text-white" />
              </div>
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#B8A9C9] to-[#A7C4D4]" />
              <CardHeader>
                <CardTitle className="flex items-center text-white text-xl">
                  <div className="p-2 bg-white/10 rounded-lg mr-3 backdrop-blur-sm">
                    <BrainCircuit className="w-6 h-6 text-[#B8A9C9]" />
                  </div>
                  Meridian Intelligence
                  <ArrowRight className="w-5 h-5 ml-auto text-gray-400 group-hover:text-white transition-colors" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm">
                    <h4 className="text-sm font-medium text-gray-400 flex items-center mb-1">
                      <Zap className="w-4 h-4 mr-1 text-[#E8C4C4]" />
                      Distraction Risk
                    </h4>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-bold text-white capitalize">{risk?.risk_level?.toLowerCase() || 'Low'}</p>
                      <span className="text-sm text-gray-400 mb-1">({Math.round((risk?.probability || 0.2) * 100)}% chance)</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-2 line-clamp-2">{risk?.explanation || 'Keep using Focus to unlock insights'}</p>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm">
                    <h4 className="text-sm font-medium text-gray-400 flex items-center mb-1">
                      <Target className="w-4 h-4 mr-1 text-[#B8A9C9]" />
                      Current Struggle Area
                    </h4>
                    {topStruggle ? (
                      <>
                        <p className="text-xl font-bold text-white truncate">{topStruggle.topic_name}</p>
                        <p className="text-sm text-[#A7C4D4] mt-1">{topStruggle.subject_name}</p>
                      </>
                    ) : (
                      <p className="text-white font-medium mt-1">No significant struggles detected. Great job!</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2 pt-4 border-t border-white/10 flex items-start gap-3 mt-2">
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-[#B5C9B3] animate-pulse"></div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Recommended Next Action</h4>
                      <p className="text-white font-medium">Start a 25-minute focus session on your highest priority task.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Upcoming Tasks */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-gray-50/50 pb-4">
              <CardTitle className="text-xl font-bold text-[#2D2D2D] flex items-center">
                <Target className="w-5 h-5 mr-2 text-[#D4756A]" />
                Priority Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingTasks.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#B5C9B3]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#2D2D2D] mb-1">You're all caught up!</h3>
                  <p className="text-[#6B6B6B]">Take a break, or add a new task to get ahead.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcomingTasks.map(task => (
                    <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors group">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                          <h3 className="font-bold text-[#2D2D2D] text-lg group-hover:text-[#B8A9C9] transition-colors">{task.title}</h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {task.subject && (
                              <Badge style={{ backgroundColor: task.subject.color + '20', color: task.subject.color, borderColor: task.subject.color + '40' }} variant="outline" className="px-2 py-0.5">
                                {task.subject.name}
                              </Badge>
                            )}
                            {task.deadline && (
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{getRelativeDate(task.deadline)}</span>
                            )}
                            {task.priority >= 4 && (
                              <Badge variant="destructive" className="bg-[#D4756A] text-white border-0 shadow-sm">High Priority</Badge>
                            )}
                          </div>
                        </div>
                        {/* Difficulty dots */}
                        <div className="flex space-x-1 mt-1 bg-gray-100 p-1.5 rounded-full">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div 
                              key={level} 
                              className={`w-2 h-2 rounded-full ${level <= (task.difficulty || 1) ? 'bg-[#A7C4D4]' : 'bg-gray-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-3 mt-5">
                        <div className="flex-1">
                          <TaskQuickActions taskId={task.id} />
                        </div>
                        <div className="flex-1">
                          <QuickStartButton taskId={task.id} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* Today's Schedule */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-bold text-[#2D2D2D] flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#A7C4D4]" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-[#6B6B6B] text-sm mb-4">No schedule generated for today yet.</p>
                <QuickStartButton />
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-bold text-[#2D2D2D] flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-[#B5C9B3]" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentSessionsData.length === 0 ? (
                <p className="text-[#6B6B6B] py-8 text-center text-sm">No sessions recorded yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentSessionsData.map(session => (
                    <div key={session.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-semibold text-[#2D2D2D] text-sm mb-0.5">
                          {session.task?.title || 'General Focus'}
                        </p>
                        <p className="text-xs font-medium text-gray-500">
                          {formatDate(session.startTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-[#A7C4D4]/20 text-[#2D2D2D] hover:bg-[#A7C4D4]/30 border-0 font-bold">
                          {formatDuration(session.actualDuration || session.plannedDuration)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
