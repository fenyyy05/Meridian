import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  subjectId: z.string().optional().nullable(),
  topicId: z.string().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  estimatedMinutes: z.number().int().min(5).max(480).default(30),
  difficulty: z.number().int().min(1).max(5).default(3),
  priority: z.number().int().min(1).max(5).default(3),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED']).optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
