'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createTaskSchema, updateTaskSchema, type CreateTaskInput, type UpdateTaskInput } from '@/lib/validations/task'
import { calculatePriorityScore } from '@/lib/utils'

type TaskFilters = {
  status?: string
  subjectId?: string
  topicId?: string
  search?: string
  sortBy?: 'deadline' | 'priority' | 'difficulty' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export async function getTasks(filters?: TaskFilters) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const where: any = { userId: session.user.id }

  if (filters?.status && filters.status !== 'ALL') {
    where.status = filters.status
  }
  if (filters?.subjectId) {
    where.subjectId = filters.subjectId
  }
  if (filters?.topicId) {
    where.topicId = filters.topicId
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const orderBy: any = {}
  const sortBy = filters?.sortBy || 'computedPriority'
  const sortOrder = filters?.sortOrder || 'desc'
  orderBy[sortBy] = sortOrder

  const tasks = await prisma.task.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, color: true } },
      topic: { select: { id: true, name: true } },
      subTasks: { orderBy: { order: 'asc' } },
      _count: { select: { studySessions: true, subTasks: true } },
    },
    orderBy,
  })

  return tasks
}

export async function getTask(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
    include: {
      subject: { select: { id: true, name: true, color: true } },
      topic: { select: { id: true, name: true } },
      subTasks: { orderBy: { order: 'asc' } },
      studySessions: {
        orderBy: { startTime: 'desc' },
        take: 5,
        select: {
          id: true,
          startTime: true,
          actualDuration: true,
          focusScore: true,
          status: true,
        },
      },
    },
  })

  if (!task) return null
  return task
}

export async function createTask(input: CreateTaskInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const parsed = createTaskSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  // Verify subject/topic ownership if provided
  if (data.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, userId: session.user.id },
    })
    if (!subject) return { error: 'Subject not found' }
  }

  const computedPriority = calculatePriorityScore({
    deadline: data.deadline ? new Date(data.deadline) : null,
    difficulty: data.difficulty,
    priority: data.priority,
    postponedCount: 0,
  })

  const task = await prisma.task.create({
    data: {
      userId: session.user.id,
      title: data.title,
      description: data.description ?? null,
      subjectId: data.subjectId ?? null,
      topicId: data.topicId ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      estimatedMinutes: data.estimatedMinutes,
      difficulty: data.difficulty,
      priority: data.priority,
      computedPriority,
    },
    include: {
      subject: { select: { id: true, name: true, color: true } },
      topic: { select: { id: true, name: true } },
    },
  })

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  revalidatePath('/planner')
  return { task }
}

export async function updateTask(input: UpdateTaskInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const parsed = updateTaskSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { id, ...data } = parsed.data

  // Verify ownership
  const existing = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return { error: 'Task not found' }

  // Recalculate priority
  const deadline = data.deadline ? new Date(data.deadline) : (existing.deadline)
  const computedPriority = calculatePriorityScore({
    deadline,
    difficulty: data.difficulty ?? existing.difficulty,
    priority: data.priority ?? existing.priority,
    postponedCount: existing.postponedCount,
  })

  const updateData: any = { ...data, computedPriority }
  if (data.deadline) updateData.deadline = new Date(data.deadline)
  if (data.status === 'COMPLETED') updateData.completedAt = new Date()

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  revalidatePath('/planner')
  return { task }
}

export async function deleteTask(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return { error: 'Task not found' }

  await prisma.task.delete({ where: { id } })
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function postponeTask(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return { error: 'Task not found' }

  const newPostponedCount = existing.postponedCount + 1
  const computedPriority = calculatePriorityScore({
    deadline: existing.deadline,
    difficulty: existing.difficulty,
    priority: existing.priority,
    postponedCount: newPostponedCount,
  })

  const task = await prisma.task.update({
    where: { id },
    data: {
      status: 'POSTPONED',
      postponedCount: newPostponedCount,
      computedPriority,
    },
  })

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { task }
}

export async function completeTask(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return { error: 'Task not found' }

  const task = await prisma.task.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })

  // Update streak
  await updateStreakForActivity(session.user.id, 'TASK_COMPLETED')

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  revalidatePath('/streak')
  return { task }
}

async function updateStreakForActivity(userId: string, activity: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const streak = await prisma.studyStreak.findUnique({
    where: { userId },
  })
  if (!streak) return

  // Check if already has activity today
  const existingActivity = await prisma.streakActivity.findUnique({
    where: {
      streakId_date: {
        streakId: streak.id,
        date: today,
      },
    },
  })

  if (existingActivity) {
    // Update existing activity
    await prisma.streakActivity.update({
      where: { id: existingActivity.id },
      data: {
        tasksCompleted: { increment: 1 },
      },
    })
  } else {
    // Create new activity
    await prisma.streakActivity.create({
      data: {
        streakId: streak.id,
        date: today,
        qualifyingActivity: activity,
        tasksCompleted: 1,
      },
    })
  }

  // Update streak counts
  const lastActive = streak.lastActiveDate
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let newStreak = streak.currentStreak

  if (!lastActive || lastActive.getTime() < yesterday.getTime()) {
    // Streak was broken or first activity
    if (!lastActive || lastActive.getTime() < yesterday.getTime()) {
      // If last active was before yesterday, reset streak
      if (lastActive && lastActive.getTime() === yesterday.getTime()) {
        newStreak = streak.currentStreak + 1
      } else {
        newStreak = 1
      }
    }
  } else if (lastActive.getTime() === yesterday.getTime()) {
    // Continuing streak from yesterday
    newStreak = streak.currentStreak + 1
  }
  // If lastActive is today, streak doesn't change

  await prisma.studyStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastActiveDate: today,
    },
  })
}
