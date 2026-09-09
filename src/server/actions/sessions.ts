'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  startSessionSchema,
  endSessionSchema,
  logDistractionSchema,
  type StartSessionInput,
  type EndSessionInput,
  type LogDistractionInput,
} from '@/lib/validations/session'

export async function startSession(input: StartSessionInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const parsed = startSessionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Verify task ownership if provided
  if (parsed.data.taskId) {
    const task = await prisma.task.findFirst({
      where: { id: parsed.data.taskId, userId: session.user.id },
    })
    if (!task) return { error: 'Task not found' }

    // Update task status to IN_PROGRESS
    await prisma.task.update({
      where: { id: parsed.data.taskId },
      data: { status: 'IN_PROGRESS' },
    })
  }

  const studySession = await prisma.studySession.create({
    data: {
      userId: session.user.id,
      taskId: parsed.data.taskId ?? null,
      startTime: new Date(),
      plannedDuration: parsed.data.plannedDuration,
      status: 'ACTIVE',
    },
  })

  revalidatePath('/focus')
  return { session: studySession }
}

export async function endSession(input: EndSessionInput) {
  const authSession = await auth()
  if (!authSession?.user?.id) throw new Error('Unauthorized')

  const parsed = endSessionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Verify session ownership
  const studySession = await prisma.studySession.findFirst({
    where: { id: parsed.data.sessionId, userId: authSession.user.id },
  })
  if (!studySession) return { error: 'Session not found' }

  const endTime = new Date()
  const actualDuration = Math.round(
    (endTime.getTime() - studySession.startTime.getTime()) / (1000 * 60)
  )

  // Count distractions for this session
  const distractionCount = await prisma.distractionEvent.count({
    where: { sessionId: studySession.id },
  })

  const updated = await prisma.studySession.update({
    where: { id: studySession.id },
    data: {
      endTime,
      actualDuration,
      focusScore: parsed.data.focusScore,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      distractionCount,
    },
  })

  // Update streak if session qualifies (>= 10 minutes completed)
  if (parsed.data.status === 'COMPLETED' && actualDuration >= 10) {
    await updateStreakForSession(authSession.user.id, actualDuration)
  }

  // Update productivity snapshot
  await updateProductivitySnapshot(authSession.user.id, actualDuration, parsed.data.status, parsed.data.focusScore, distractionCount)

  revalidatePath('/focus')
  revalidatePath('/dashboard')
  revalidatePath('/streak')
  revalidatePath('/analytics')
  return { session: updated }
}

export async function logDistraction(input: LogDistractionInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const parsed = logDistractionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Verify session ownership if sessionId provided
  if (parsed.data.sessionId) {
    const studySession = await prisma.studySession.findFirst({
      where: { id: parsed.data.sessionId, userId: session.user.id },
    })
    if (!studySession) return { error: 'Session not found' }
  }

  const distraction = await prisma.distractionEvent.create({
    data: {
      userId: session.user.id,
      sessionId: parsed.data.sessionId ?? null,
      category: parsed.data.category,
      duration: parsed.data.duration ?? null,
      description: parsed.data.description ?? null,
    },
  })

  // Update distraction count on session
  if (parsed.data.sessionId) {
    await prisma.studySession.update({
      where: { id: parsed.data.sessionId },
      data: { distractionCount: { increment: 1 } },
    })
  }

  return { distraction }
}

export async function getRecentSessions(limit: number = 10) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  return prisma.studySession.findMany({
    where: { userId: session.user.id },
    include: {
      task: { select: { id: true, title: true, subject: { select: { name: true, color: true } } } },
      distractionEvents: true,
    },
    orderBy: { startTime: 'desc' },
    take: limit,
  })
}

export async function getSessionStats() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const { getLocalToday } = await import('@/lib/date-utils')
  const today = getLocalToday()

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [todaySessions, weekSessions, allTimeSessions] = await Promise.all([
    prisma.studySession.aggregate({
      where: {
        userId: session.user.id,
        startTime: { gte: today },
        status: { in: ['COMPLETED', 'INTERRUPTED'] },
      },
      _sum: { actualDuration: true },
      _avg: { focusScore: true },
      _count: true,
    }),
    prisma.studySession.aggregate({
      where: {
        userId: session.user.id,
        startTime: { gte: weekAgo },
        status: { in: ['COMPLETED', 'INTERRUPTED'] },
      },
      _sum: { actualDuration: true },
      _avg: { focusScore: true },
      _count: true,
    }),
    prisma.studySession.aggregate({
      where: {
        userId: session.user.id,
        status: { in: ['COMPLETED', 'INTERRUPTED'] },
      },
      _sum: { actualDuration: true },
      _avg: { focusScore: true },
      _count: true,
    }),
  ])

  return {
    today: {
      totalMinutes: todaySessions._sum.actualDuration ?? 0,
      avgFocusScore: todaySessions._avg.focusScore ? Math.round(todaySessions._avg.focusScore * 10) / 10 : null,
      sessionCount: todaySessions._count,
    },
    week: {
      totalMinutes: weekSessions._sum.actualDuration ?? 0,
      avgFocusScore: weekSessions._avg.focusScore ? Math.round(weekSessions._avg.focusScore * 10) / 10 : null,
      sessionCount: weekSessions._count,
    },
    allTime: {
      totalMinutes: allTimeSessions._sum.actualDuration ?? 0,
      avgFocusScore: allTimeSessions._avg.focusScore ? Math.round(allTimeSessions._avg.focusScore * 10) / 10 : null,
      sessionCount: allTimeSessions._count,
    },
  }
}

async function updateStreakForSession(userId: string, durationMinutes: number) {
  const { getLocalToday } = await import('@/lib/date-utils')
  const today = getLocalToday()

  const streak = await prisma.studyStreak.findUnique({ where: { userId } })
  if (!streak) return

  const existingActivity = await prisma.streakActivity.findUnique({
    where: { streakId_date: { streakId: streak.id, date: today } },
  })

  if (existingActivity) {
    await prisma.streakActivity.update({
      where: { id: existingActivity.id },
      data: { focusMinutes: { increment: durationMinutes } },
    })
  } else {
    await prisma.streakActivity.create({
      data: {
        streakId: streak.id,
        date: today,
        qualifyingActivity: 'FOCUS_SESSION',
        focusMinutes: durationMinutes,
      },
    })
  }

  // Update streak counters
  const lastActive = streak.lastActiveDate
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let newStreak = streak.currentStreak
  if (!lastActive) {
    newStreak = 1
  } else {
    const { getLocalStartOfDay } = await import('@/lib/date-utils')
    const lastActiveDay = getLocalStartOfDay(lastActive)
    if (lastActiveDay.getTime() === yesterday.getTime()) {
      newStreak = streak.currentStreak + 1
    } else if (lastActiveDay.getTime() < yesterday.getTime()) {
      newStreak = 1
    }
  }

  await prisma.studyStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastActiveDate: today,
    },
  })
}

async function updateProductivitySnapshot(
  userId: string,
  duration: number,
  status: string,
  focusScore: number | undefined | null,
  distractionCount: number
) {
  const { getLocalToday } = await import('@/lib/date-utils')
  const today = getLocalToday()

  const existing = await prisma.productivitySnapshot.findUnique({
    where: { userId_date: { userId, date: today } },
  })

  if (existing) {
    const newTotalMinutes = existing.totalFocusMinutes + duration
    const newDistractions = existing.distractionCount + distractionCount
    const newAvgScore = focusScore
      ? existing.avgFocusScore
        ? (existing.avgFocusScore + focusScore) / 2
        : focusScore
      : existing.avgFocusScore

    await prisma.productivitySnapshot.update({
      where: { id: existing.id },
      data: {
        totalFocusMinutes: newTotalMinutes,
        distractionCount: newDistractions,
        avgFocusScore: newAvgScore,
      },
    })
  } else {
    await prisma.productivitySnapshot.create({
      data: {
        userId,
        date: today,
        totalFocusMinutes: duration,
        distractionCount,
        avgFocusScore: focusScore ?? null,
      },
    })
  }
}
