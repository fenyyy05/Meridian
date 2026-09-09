import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function calculatePriorityScore(task: {
  deadline: Date | null
  difficulty: number
  priority: number
  postponedCount: number
  struggleScore?: number
}): number {
  let score = 0
  
  // Deadline urgency (0-1, exponential decay)
  if (task.deadline) {
    const hoursUntilDeadline = (task.deadline.getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntilDeadline <= 0) {
      score += 0.35 // overdue: max urgency
    } else if (hoursUntilDeadline <= 24) {
      score += 0.35 * Math.exp(-hoursUntilDeadline / 24)
    } else if (hoursUntilDeadline <= 72) {
      score += 0.25 * Math.exp(-hoursUntilDeadline / 72)
    } else {
      score += 0.1 * Math.exp(-hoursUntilDeadline / 168)
    }
  }
  
  // Difficulty factor (normalized 0-1)
  score += (task.difficulty / 5) * 0.2
  
  // Manual priority (normalized 0-1)
  score += (task.priority / 5) * 0.2
  
  // Struggle score from ML (0-1)
  score += (task.struggleScore ?? 0) * 0.15
  
  // Postponed penalty
  score += Math.min(Math.log(1 + task.postponedCount) / 3, 0.1)
  
  return Math.round(score * 100) / 100
}
