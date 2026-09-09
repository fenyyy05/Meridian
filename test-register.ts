import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash',
        profile: {
          create: {},
        },
        studyStreak: {
          create: {},
        },
      },
    })
    console.log('Success:', user)
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
