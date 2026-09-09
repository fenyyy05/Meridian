'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createTopicSchema, type CreateTopicInput } from '@/lib/validations/subject'

export async function getTopicsBySubject(subjectId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Verify subject ownership
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId: session.user.id },
  })
  if (!subject) throw new Error('Subject not found')

  return prisma.topic.findMany({
    where: { subjectId },
    include: {
      _count: { select: { tasks: true, resources: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createTopic(input: CreateTopicInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const parsed = createTopicSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Verify subject ownership
  const subject = await prisma.subject.findFirst({
    where: { id: parsed.data.subjectId, userId: session.user.id },
  })
  if (!subject) return { error: 'Subject not found' }

  try {
    const topic = await prisma.topic.create({
      data: parsed.data,
    })
    revalidatePath('/tasks')
    revalidatePath('/dashboard')
    return { topic }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { error: 'A topic with this name already exists in this subject' }
    }
    return { error: 'Failed to create topic' }
  }
}

export async function updateTopic(id: string, input: Partial<CreateTopicInput>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Verify ownership through subject
  const topic = await prisma.topic.findFirst({
    where: { id },
    include: { subject: { select: { userId: true } } },
  })
  if (!topic || topic.subject.userId !== session.user.id) {
    return { error: 'Topic not found' }
  }

  try {
    const updated = await prisma.topic.update({
      where: { id },
      data: input,
    })
    revalidatePath('/tasks')
    return { topic: updated }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { error: 'A topic with this name already exists in this subject' }
    }
    return { error: 'Failed to update topic' }
  }
}

export async function deleteTopic(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const topic = await prisma.topic.findFirst({
    where: { id },
    include: { subject: { select: { userId: true } } },
  })
  if (!topic || topic.subject.userId !== session.user.id) {
    return { error: 'Topic not found' }
  }

  await prisma.topic.delete({ where: { id } })
  revalidatePath('/tasks')
  return { success: true }
}
