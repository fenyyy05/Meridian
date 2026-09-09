import { describe, it, expect } from 'vitest'
import { calculatePriorityScore, formatDuration } from '@/lib/utils'

describe('formatDuration', () => {
  it('formats minutes less than an hour correctly', () => {
    expect(formatDuration(45)).toBe('45m')
  })

  it('formats exact hours correctly', () => {
    expect(formatDuration(120)).toBe('2h')
  })

  it('formats hours and minutes correctly', () => {
    expect(formatDuration(135)).toBe('2h 15m')
  })
})

describe('calculatePriorityScore', () => {
  it('calculates score for standard task without deadline', () => {
    const score = calculatePriorityScore({
      deadline: null,
      difficulty: 3,
      priority: 3,
      postponedCount: 0
    })
    // 3/5 * 0.2 + 3/5 * 0.2 = 0.12 + 0.12 = 0.24
    expect(score).toBeCloseTo(0.24)
  })

  it('prioritizes overdue tasks heavily', () => {
    const overdue = new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    const score = calculatePriorityScore({
      deadline: overdue,
      difficulty: 3,
      priority: 3,
      postponedCount: 0
    })
    expect(score).toBeGreaterThan(0.5)
  })

  it('adds penalty for postponed tasks', () => {
    const score1 = calculatePriorityScore({
      deadline: null,
      difficulty: 3,
      priority: 3,
      postponedCount: 0
    })
    const score2 = calculatePriorityScore({
      deadline: null,
      difficulty: 3,
      priority: 3,
      postponedCount: 5
    })
    expect(score2).toBeGreaterThan(score1)
  })
})
