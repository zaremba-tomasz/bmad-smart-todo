import { z } from 'zod'

export const TaskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1),
  dueDate: z.string().nullable(),
  dueTime: z.string().nullable(),
  location: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable(),
  groupId: z.string().uuid().nullable(),
  isCompleted: z.boolean(),
  completedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
})

export const CreateTaskRequestSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().nullable(),
  dueTime: z.string().nullable(),
  location: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable(),
  groupId: z.null(),
})
