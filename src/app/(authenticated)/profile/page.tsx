import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      studyStreak: true,
      _count: {
        select: {
          tasks: { where: { status: 'COMPLETED' } },
          studySessions: true,
        }
      }
    }
  })

  if (!user) redirect('/login')

  const totalFocusMinutesResult = await prisma.studySession.aggregate({
    where: { userId: user.id, status: 'COMPLETED' },
    _sum: { actualDuration: true }
  })
  
  const totalFocusMinutes = totalFocusMinutesResult._sum.actualDuration || 0
  const focusHours = Math.floor(totalFocusMinutes / 60)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-[#2D2D2D]">Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="text-center pb-2">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-[#FBF8F3]">
              <AvatarImage src={user.image || ''} />
              <AvatarFallback className="text-2xl bg-[#B8A9C9] text-white">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <p className="text-sm text-[#6B6B6B]">{user.email}</p>
          </CardHeader>
          <CardContent className="text-center pt-4">
            <Badge className="bg-[#E8C4C4]/20 text-[#D4756A] border-none mb-4">
              {user.profile?.academicLevel?.replace('_', ' ') || 'Student'}
            </Badge>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#2D2D2D]">{user.studyStreak?.currentStreak || 0}</p>
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">Day Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#2D2D2D]">{user.studyStreak?.longestStreak || 0}</p>
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">Best Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Academic Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#FBF8F3] p-4 rounded-xl border border-[#E8E4DF] text-center">
                <p className="text-3xl font-bold text-[#B8A9C9] mb-1">{focusHours}</p>
                <p className="text-sm text-[#6B6B6B]">Total Focus Hours</p>
              </div>
              
              <div className="bg-[#FBF8F3] p-4 rounded-xl border border-[#E8E4DF] text-center">
                <p className="text-3xl font-bold text-[#A7C4D4] mb-1">{user._count.tasks}</p>
                <p className="text-sm text-[#6B6B6B]">Tasks Completed</p>
              </div>
              
              <div className="bg-[#FBF8F3] p-4 rounded-xl border border-[#E8E4DF] text-center">
                <p className="text-3xl font-bold text-[#B5C9B3] mb-1">{user._count.studySessions}</p>
                <p className="text-sm text-[#6B6B6B]">Study Sessions</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="font-semibold text-[#2D2D2D]">Study Preferences</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[#6B6B6B]">Daily Goal</p>
                  <p className="font-medium text-[#2D2D2D]">{user.profile?.dailyGoalMinutes} minutes</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#6B6B6B]">Focus Duration</p>
                  <p className="font-medium text-[#2D2D2D]">{user.profile?.focusDuration} minutes</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#6B6B6B]">Preferred Start</p>
                  <p className="font-medium text-[#2D2D2D]">{user.profile?.preferredStudyStart || 'Not set'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#6B6B6B]">Preferred End</p>
                  <p className="font-medium text-[#2D2D2D]">{user.profile?.preferredStudyEnd || 'Not set'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
