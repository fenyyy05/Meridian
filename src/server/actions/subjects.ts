'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createSubjectSchema, type CreateSubjectInput } from '@/lib/validations/subject'

export async function getSubjects() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  return prisma.subject.findMany({
    where: { userId: session.user.id },
    include: {
      topics: {
        orderBy: { name: 'asc' },
      },
      _count: {
        select: { tasks: true, resources: true },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createSubject(input: CreateSubjectInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const parsed = createSubjectSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    const subject = await prisma.subject.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
      },
    })
    revalidatePath('/tasks')
    revalidatePath('/dashboard')
    return { subject }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { error: 'A subject with this name already exists' }
    }
    return { error: 'Failed to create subject' }
  }
}

export async function updateSubject(id: string, input: Partial<CreateSubjectInput>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Verify ownership
  const existing = await prisma.subject.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return { error: 'Subject not found' }

  try {
    const subject = await prisma.subject.update({
      where: { id },
      data: input,
    })
    revalidatePath('/tasks')
    revalidatePath('/dashboard')
    return { subject }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { error: 'A subject with this name already exists' }
    }
    return { error: 'Failed to update subject' }
  }
}

export async function deleteSubject(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await prisma.subject.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return { error: 'Subject not found' }

  await prisma.subject.delete({ where: { id } })
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}
