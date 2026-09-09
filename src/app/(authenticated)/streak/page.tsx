import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Trophy, CalendarDays, Activity } from 'lucide-react'

export default async function StreakPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const streak = await prisma.studyStreak.findUnique({
    where: { userId: session.user.id },
    include: {
      activities: {
        orderBy: { date: 'desc' },
        take: 30
      }
    }
  })

  const currentStreak = streak?.currentStreak || 0
  const longestStreak = streak?.longestStreak || 0
  const activities = streak?.activities || []

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-[#2D2D2D] tracking-tight">Study Streak</h1>
        <p className="text-[#6B6B6B] mt-1">Keep your momentum going. Consistency is key!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#E8E4DF] shadow-sm bg-gradient-to-br from-[#FFF5F2] to-[#FFE8E3]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#D4756A]">Current Streak</CardTitle>
            <Flame className="w-5 h-5 text-[#D4756A]" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-extrabold text-[#2D2D2D] mb-2">{currentStreak} <span className="text-xl font-medium text-[#6B6B6B]">days</span></div>
            <p className="text-sm text-[#6B6B6B]">
              {currentStreak > 0 ? "You're on fire! Keep studying every day." : "Start your streak by completing a focus session today!"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E8E4DF] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Longest Streak</CardTitle>
            <Trophy className="w-5 h-5 text-[#B8A9C9]" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-[#2D2D2D] mb-2">{longestStreak} <span className="text-xl font-medium text-[#6B6B6B]">days</span></div>
            <p className="text-sm text-[#6B6B6B]">Your all-time personal best.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#E8E4DF] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-[#2D2D2D]">
            <Activity className="w-5 h-5 mr-2 text-[#A7C4D4]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-[#6B6B6B]">
              <CalendarDays className="w-12 h-12 mx-auto text-[#E8E4DF] mb-4" />
              <p>No streak activities recorded yet.</p>
              <p className="text-sm mt-1">Complete tasks and focus sessions to build your history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center p-4 border border-[#E8E4DF] rounded-xl hover:bg-[#FBF8F3] transition-colors">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#2D2D2D] capitalize">{activity.qualifyingActivity.replace('_', ' ').toLowerCase()}</span>
                    <span className="text-xs text-[#6B6B6B]">{formatDate(activity.date)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {activity.focusMinutes > 0 && (
                      <div className="text-sm">
                        <span className="text-[#A7C4D4] font-semibold">{activity.focusMinutes}m</span> focus
                      </div>
                    )}
                    {activity.tasksCompleted > 0 && (
                      <div className="text-sm">
                        <span className="text-[#B5C9B3] font-semibold">{activity.tasksCompleted}</span> tasks
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
