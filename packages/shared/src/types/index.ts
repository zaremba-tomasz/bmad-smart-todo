import type { z } from 'zod'

import type {
  TaskSchema,
  CreateTaskRequestSchema,
  ExtractionResultSchema,
  GroupSchema,
  ApiErrorSchema,
  ErrorCode,
} from '../schemas/index.js'

export type Task = z.infer<typeof TaskSchema>
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>
export type Group = z.infer<typeof GroupSchema>
export type ApiError = z.infer<typeof ApiErrorSchema>
export type ErrorCodeType = z.infer<typeof ErrorCode>
