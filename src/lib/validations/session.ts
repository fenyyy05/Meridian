import { z } from 'zod'

export const startSessionSchema = z.object({
  taskId: z.string().optional().nullable(),
  plannedDuration: z.number().int().min(5).max(120),
})

export const endSessionSchema = z.object({
  sessionId: z.string(),
  focusScore: z.number().int().min(1).max(5).optional(),
  status: z.enum(['COMPLETED', 'INTERRUPTED', 'ABANDONED']),
  notes: z.string().max(500).optional().nullable(),
})

export const logDistractionSchema = z.object({
  sessionId: z.string().optional().nullable(),
  category: z.enum(['SOCIAL_MEDIA', 'YOUTUBE', 'MESSAGING', 'GAMING', 'NOTIFICATIONS', 'ENVIRONMENT', 'TAB_SWITCH', 'OTHER']),
  duration: z.number().int().min(0).max(3600).optional().nullable(),
  description: z.string().max(200).optional().nullable(),
})

export type StartSessionInput = z.infer<typeof startSessionSchema>
export type EndSessionInput = z.infer<typeof endSessionSchema>
export type LogDistractionInput = z.infer<typeof logDistractionSchema>
