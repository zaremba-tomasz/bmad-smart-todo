import { z } from 'zod'

export const ErrorCode = z.enum([
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'RATE_LIMITED',
  'EXTRACTION_TIMEOUT',
  'EXTRACTION_PROVIDER_ERROR',
  'EXTRACTION_VALIDATION_FAILED',
  'UNAUTHORIZED',
  'SERVER_ERROR',
])

export function ApiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({ data: dataSchema })
}

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
  }),
})
