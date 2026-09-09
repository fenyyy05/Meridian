import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { Sidebar } from '@/components/layout/sidebar'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // Check onboarding status
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { onboardingComplete: true },
  })

  // If not onboarded and not already on onboarding page, redirect
  // (We'll handle this in middleware/page level too)

  return (
    <AuthSessionProvider>
      <div className="flex h-screen bg-[#FBF8F3] flex-col md:flex-row">
        <Sidebar />
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthSessionProvider>
  )
}
