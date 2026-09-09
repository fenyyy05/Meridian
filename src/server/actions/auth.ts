'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { signIn, signOut } from '@/auth'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'

export async function registerUser(input: RegisterInput) {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, email, password } = parsed.data

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (existingUser) {
    return { error: 'An account with this email already exists' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      profile: {
        create: {},
      },
      studyStreak: {
        create: {},
      },
    },
  })

  // Sign in after registration
  await signIn('credentials', {
    email: email.toLowerCase(),
    password,
    redirectTo: '/onboarding',
  })
}

export async function loginUser(email: string, password: string) {
  try {
    await signIn('credentials', {
      email: email.toLowerCase(),
      password,
      redirectTo: '/dashboard',
    })
  } catch (error: any) {
    if (error?.type === 'CredentialsSignin') {
      return { error: 'Invalid email or password' }
    }
    throw error
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: '/' })
}
