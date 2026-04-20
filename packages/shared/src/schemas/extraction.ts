import { z } from 'zod'

export const ExtractRequestSchema = z.object({
  text: z.string().min(1),
})

export const ExtractionResultSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().nullable(),
  dueTime: z.string().nullable(),
  location: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable(),
  recurrence: z.object({
    pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().nullable(),
    dayOfWeek: z.string().nullable(),
    dayOfMonth: z.number().nullable(),
  }).nullable(),
})
