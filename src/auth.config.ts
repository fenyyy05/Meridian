import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/tasks') ||
        nextUrl.pathname.startsWith('/focus') ||
        nextUrl.pathname.startsWith('/planner') ||
        nextUrl.pathname.startsWith('/study-hub') ||
        nextUrl.pathname.startsWith('/intelligence') ||
        nextUrl.pathname.startsWith('/streak') ||
        nextUrl.pathname.startsWith('/analytics') ||
        nextUrl.pathname.startsWith('/profile') ||
        nextUrl.pathname.startsWith('/settings') ||
        nextUrl.pathname.startsWith('/onboarding')

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect to login
      }

      if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  providers: [],
}
