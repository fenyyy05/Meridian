import { z } from 'zod'

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#B8A9C9'),
  icon: z.string().max(50).optional().nullable(),
})

export const createTopicSchema = z.object({
  subjectId: z.string(),
  name: z.string().min(1, 'Topic name is required').max(100),
  difficulty: z.number().int().min(1).max(5).default(3),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
})

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>
export type CreateTopicInput = z.infer<typeof createTopicSchema>
