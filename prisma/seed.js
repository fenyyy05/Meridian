const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clean up existing demo data
  await prisma.user.deleteMany({
    where: { email: 'demo@meridian.app' }
  })

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12)
  const user = await prisma.user.create({
    data: {
      name: 'Demo Student',
      email: 'demo@meridian.app',
      passwordHash,
      profile: {
        create: {
          academicLevel: 'UNDERGRADUATE',
          preferredStudyStart: '09:00',
          preferredStudyEnd: '17:00',
          dailyGoalMinutes: 120,
          focusDuration: 25,
          onboardingComplete: true
        }
      },
      streak: {
        create: {
          currentStreak: 5,
          longestStreak: 12,
          lastActiveDate: new Date()
        }
      }
    }
  })

  console.log('Created demo user:', user.email)

  // Create Subjects
  const subjects = await Promise.all([
    prisma.subject.create({
      data: {
        userId: user.id,
        name: 'Computer Science',
        color: '#A7C4D4',
        icon: 'Code'
      }
    }),
    prisma.subject.create({
      data: {
        userId: user.id,
        name: 'Mathematics',
        color: '#B8A9C9',
        icon: 'Calculator'
      }
    }),
    prisma.subject.create({
      data: {
        userId: user.id,
        name: 'Physics',
        color: '#B5C9B3',
        icon: 'Atom'
      }
    })
  ])

  // Create Topics
  const cs = subjects.find(s => s.name === 'Computer Science')
  const math = subjects.find(s => s.name === 'Mathematics')

  const topics = await Promise.all([
    prisma.topic.create({
      data: {
        subjectId: cs.id,
        name: 'Data Structures',
        difficulty: 4,
        confidenceLevel: 3
      }
    }),
    prisma.topic.create({
      data: {
        subjectId: cs.id,
        name: 'Algorithms',
        difficulty: 5,
        confidenceLevel: 2
      }
    }),
    prisma.topic.create({
      data: {
        subjectId: math.id,
        name: 'Calculus',
        difficulty: 4,
        confidenceLevel: 4
      }
    })
  ])

  // Create Curated Resources
  const resources = await Promise.all([
    prisma.resource.create({
      data: {
        title: 'Introduction to Algorithms (MIT OpenCourseWare)',
        type: 'VIDEO',
        difficulty: 4,
        description: 'Comprehensive lecture series on algorithms and data structures.',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/',
        tags: ['algorithms', 'video', 'mit', 'lecture'],
        isSeeded: true,
        subjectId: cs.id,
        topicId: topics.find(t => t.name === 'Algorithms').id
      }
    }),
    prisma.resource.create({
      data: {
        title: 'Big O Cheat Sheet',
        type: 'NOTES',
        difficulty: 2,
        description: 'Quick reference for time and space complexity of common algorithms.',
        url: 'https://www.bigocheatsheet.com/',
        tags: ['algorithms', 'complexity', 'cheatsheet'],
        isSeeded: true,
        subjectId: cs.id,
        topicId: topics.find(t => t.name === 'Algorithms').id
      }
    }),
    prisma.resource.create({
      data: {
        title: 'Visualizing Data Structures',
        type: 'ARTICLE',
        difficulty: 3,
        description: 'Interactive animations for various data structures and their operations.',
        url: 'https://visualgo.net/en',
        tags: ['data-structures', 'interactive', 'visualization'],
        isSeeded: true,
        subjectId: cs.id,
        topicId: topics.find(t => t.name === 'Data Structures').id
      }
    }),
    prisma.resource.create({
      data: {
        title: 'Paul\'s Online Math Notes: Calculus I',
        type: 'NOTES',
        difficulty: 3,
        description: 'Comprehensive notes and practice problems for Calculus.',
        url: 'https://tutorial.math.lamar.edu/Classes/CalcI/CalcI.aspx',
        tags: ['calculus', 'math', 'notes', 'practice'],
        isSeeded: true,
        subjectId: math.id,
        topicId: topics.find(t => t.name === 'Calculus').id
      }
    })
  ])

  // Create Tasks
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Implement Red-Black Tree',
        description: 'Write the insertion and deletion logic for a Red-Black tree in Python.',
        subjectId: cs.id,
        topicId: topics.find(t => t.name === 'Data Structures').id,
        deadline: tomorrow,
        estimatedMinutes: 120,
        difficulty: 5,
        priority: 4,
        computedPriority: 0.85,
        status: 'TODO'
      }
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Watch Graph Algorithms Lecture',
        subjectId: cs.id,
        topicId: topics.find(t => t.name === 'Algorithms').id,
        deadline: today,
        estimatedMinutes: 60,
        difficulty: 3,
        priority: 3,
        computedPriority: 0.9,
        status: 'TODO'
      }
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Complete Integration Practice Set',
        subjectId: math.id,
        topicId: topics.find(t => t.name === 'Calculus').id,
        deadline: today,
        estimatedMinutes: 90,
        difficulty: 4,
        priority: 5,
        computedPriority: 0.95,
        status: 'IN_PROGRESS'
      }
    })
  ])

  // Create some past Study Sessions for Analytics
  const pastSessions = []
  for (let i = 1; i <= 7; i++) {
    const sessionDate = new Date(today)
    sessionDate.setDate(today.getDate() - i)
    
    // Create 1-3 sessions per day
    const sessionCount = Math.floor(Math.random() * 3) + 1
    
    for (let j = 0; j < sessionCount; j++) {
      pastSessions.push({
        userId: user.id,
        taskId: tasks[Math.floor(Math.random() * tasks.length)].id,
        startTime: sessionDate,
        endTime: new Date(sessionDate.getTime() + 25 * 60000), // 25 mins later
        plannedDuration: 25,
        actualDuration: 25,
        focusScore: Math.floor(Math.random() * 3) + 3, // 3-5 score
        status: 'COMPLETED',
        distractionCount: Math.floor(Math.random() * 3)
      })
    }
  }

  await prisma.studySession.createMany({ data: pastSessions })

  // Add Productivity Snapshots for the last 7 days
  const snapshots = []
  for (let i = 1; i <= 7; i++) {
    const snapDate = new Date(today)
    snapDate.setDate(today.getDate() - i)
    snapDate.setHours(0, 0, 0, 0)
    
    snapshots.push({
      userId: user.id,
      date: snapDate,
      totalFocusMinutes: Math.floor(Math.random() * 120) + 30, // 30-150 mins
      tasksCompleted: Math.floor(Math.random() * 3),
      tasksPostponed: Math.floor(Math.random() * 2),
      avgFocusScore: (Math.random() * 2) + 3, // 3.0-5.0
      distractionCount: Math.floor(Math.random() * 5),
      distractionMinutes: Math.floor(Math.random() * 15)
    })
  }

  await prisma.productivitySnapshot.createMany({ data: snapshots })

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
