'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, CheckSquare, Calendar, Timer, BookOpen,
  Brain, BarChart3, Flame, User, Settings, Sparkles,
  ChevronLeft, ChevronRight, Menu, X, LogOut,
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Tasks', icon: CheckSquare, href: '/tasks' },
  { name: 'Planner', icon: Calendar, href: '/planner' },
  { name: 'Focus', icon: Timer, href: '/focus' },
  { name: 'Study Hub', icon: BookOpen, href: '/study-hub' },
  { name: 'Intelligence', icon: Brain, href: '/intelligence' },
  { name: 'Analytics', icon: BarChart3, href: '/analytics' },
  { name: 'Study Streak', icon: Flame, href: '/streak' },
]

const bottomItems = [
  { name: 'Profile', icon: User, href: '/profile' },
  { name: 'Settings', icon: Settings, href: '/settings' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  useEffect(() => {
    const stored = localStorage.getItem('meridian:sidebar:collapsed')
    if (stored) setCollapsed(JSON.parse(stored))
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('meridian:sidebar:collapsed', JSON.stringify(next))
      return next
    })
  }

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const NavLink = ({ item, isBottom = false }: { item: typeof navItems[0], isBottom?: boolean }) => {
    const isActive = pathname === item.href

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group relative",
          isActive 
            ? "bg-[#B8A9C9]/10 text-[#B8A9C9] font-medium" 
            : "text-[#6B6B6B] hover:bg-[#FBF8F3] hover:text-[#2D2D2D]",
          collapsed ? "justify-center" : "justify-start"
        )}
        aria-label={item.name}
        title={collapsed ? item.name : undefined}
      >
        <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#B8A9C9]" : "text-[#6B6B6B] group-hover:text-[#2D2D2D]")} />
        
        {!collapsed && <span>{item.name}</span>}
        
        {isActive && !collapsed && (
          <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#B8A9C9]" />
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#E8E4DF] sticky top-0 z-20">
        <div className="flex items-center gap-2 text-[#2D2D2D] font-bold text-xl">
          <Sparkles className="w-6 h-6 text-[#B8A9C9]" />
          <span>Meridian</span>
        </div>
        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2 text-[#6B6B6B] hover:bg-[#FBF8F3] rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-[#2D2D2D]/20 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          "bg-white border-r border-[#E8E4DF] flex flex-col h-full z-40 transition-all duration-300",
          "fixed md:sticky top-0",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-[#E8E4DF]">
          <div className={cn("flex items-center gap-2 text-[#2D2D2D] font-bold text-xl overflow-hidden whitespace-nowrap", collapsed && "justify-center w-full")}>
            <Sparkles className="w-6 h-6 text-[#B8A9C9] shrink-0" />
            {!collapsed && <span>Meridian</span>}
          </div>
          
          <div className="md:hidden">
            <button onClick={() => setMobileOpen(false)} className="p-1 text-[#6B6B6B]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Toggle Button */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex absolute -right-3 top-20 bg-white border border-[#E8E4DF] rounded-full p-1 text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#FBF8F3] shadow-sm z-10"
          title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        {/* Bottom Area */}
        <div className="p-3 border-t border-[#E8E4DF] space-y-1">
          {bottomItems.map((item) => (
            <NavLink key={item.name} item={item} isBottom />
          ))}

          {/* User Profile / Logout */}
          <div className={cn("mt-4 pt-4 border-t border-[#E8E4DF] flex items-center", collapsed ? "justify-center" : "justify-between px-3")}>
            {collapsed ? (
               <button
                  onClick={() => signOut()}
                  className="w-10 h-10 rounded-full bg-[#E8C4C4]/20 text-[#D4756A] flex items-center justify-center hover:bg-[#E8C4C4]/40 transition-colors"
                  title="Logout"
               >
                  <LogOut className="w-5 h-5" />
               </button>
            ) : (
               <>
                 <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-[#A7C4D4] text-white flex items-center justify-center font-semibold text-sm shrink-0">
                      {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium text-[#2D2D2D] truncate">
                        {session?.user?.name || 'User'}
                      </span>
                      <span className="text-xs text-[#6B6B6B] truncate">
                         {session?.user?.email}
                      </span>
                    </div>
                 </div>
                 <button
                    onClick={() => signOut()}
                    className="p-1.5 text-[#6B6B6B] hover:text-[#D4756A] hover:bg-[#E8C4C4]/20 rounded-md transition-colors"
                    title="Logout"
                 >
                   <LogOut className="w-4 h-4" />
                 </button>
               </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
