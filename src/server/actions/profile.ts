'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: {
  name?: string
  academicLevel?: string
  preferredStudyStart?: string
  preferredStudyEnd?: string
  dailyGoalMinutes?: number
  focusDuration?: number
  breakDuration?: number
  onboardingComplete?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Update user name if provided
  if (data.name) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: data.name },
    })
  }

  // Update profile
  const { name, ...profileData } = data
  await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: profileData,
    create: {
      userId: session.user.id,
      ...profileData,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/settings')
  return { success: true }
}

export async function getProfile() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  return prisma.profile.findUnique({
    where: { userId: session.user.id },
  })
}
