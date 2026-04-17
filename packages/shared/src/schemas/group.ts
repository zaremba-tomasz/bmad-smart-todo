import { z } from 'zod'

export const GroupSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string(),
})
