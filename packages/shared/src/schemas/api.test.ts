import { describe, it, expect } from 'vitest'
import { z } from 'zod'

import { ApiSuccessSchema, ApiErrorSchema, ErrorCode } from './api'

describe('ApiSuccessSchema', () => {
  it('wraps a data schema in success envelope', () => {
    const schema = ApiSuccessSchema(z.object({ id: z.string() }))
    const result = schema.safeParse({ data: { id: '123' } })
    expect(result.success).toBe(true)
  })
})

describe('ApiErrorSchema', () => {
  it('validates an error response', () => {
    const result = ApiErrorSchema.safeParse({
      error: {
        code: 'NOT_FOUND',
        message: 'Task not found',
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid error codes', () => {
    const result = ApiErrorSchema.safeParse({
      error: {
        code: 'INVALID_CODE',
        message: 'test',
      },
    })
    expect(result.success).toBe(false)
  })
})

describe('ErrorCode', () => {
  it('contains all expected error codes', () => {
    const codes = ErrorCode.options
    expect(codes).toContain('VALIDATION_ERROR')
    expect(codes).toContain('NOT_FOUND')
    expect(codes).toContain('RATE_LIMITED')
    expect(codes).toContain('EXTRACTION_TIMEOUT')
    expect(codes).toContain('EXTRACTION_PROVIDER_ERROR')
    expect(codes).toContain('EXTRACTION_VALIDATION_FAILED')
    expect(codes).toContain('UNAUTHORIZED')
    expect(codes).toContain('SERVER_ERROR')
  })
})
