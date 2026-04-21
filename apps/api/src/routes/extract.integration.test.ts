import { ExtractionResultSchema } from '@smart-todo/shared'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  cleanupTestUser,
  createTestUser,
  getTestUserToken,
  setIntegrationEnv,
} from '../test-utils/integration-helpers.js'

const VALID_EXTRACTION = {
  title: 'Call the dentist',
  dueDate: '2026-04-27',
  dueTime: null,
  location: null,
  priority: 'high' as const,
  recurrence: null,
}

const mockExtract = vi.fn()

vi.mock('../services/llm-provider.js', () => ({
  createLLMProvider: () => ({ extract: mockExtract }),
  ExtractionTimeoutError: class ExtractionTimeoutError extends Error {
    constructor() {
      super('LLM extraction timed out')
      this.name = 'ExtractionTimeoutError'
    }
  },
  ExtractionProviderError: class ExtractionProviderError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ExtractionProviderError'
    }
  },
}))

const TEST_EMAIL = 'int-extract@test.local'

let fastify: FastifyInstance
let token: string

beforeAll(async () => {
  setIntegrationEnv()
  vi.stubEnv('LLM_PROVIDER', 'openrouter')
  vi.stubEnv('OPENROUTER_MODEL', 'test-model')

  const { buildServer } = await import('../server.js')
  fastify = buildServer()
  await fastify.ready()

  await createTestUser(TEST_EMAIL)
  token = await getTestUserToken(TEST_EMAIL)
})

afterAll(async () => {
  await cleanupTestUser(TEST_EMAIL)
  await fastify.close()
  vi.unstubAllEnvs()
})

describe('extract route integration tests', () => {
  it('returns 401 without auth', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/extract',
      payload: { text: 'some task' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('UNAUTHORIZED')
  })

  it('returns 400 VALIDATION_ERROR with empty text', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/extract',
      headers: { authorization: `Bearer ${token}` },
      payload: { text: '' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 VALIDATION_ERROR with missing text', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/extract',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('successful extraction returns data matching ExtractionResultSchema', async () => {
    mockExtract.mockResolvedValueOnce(VALID_EXTRACTION)

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/extract',
      headers: { authorization: `Bearer ${token}` },
      payload: { text: 'Call the dentist next Monday, high priority' },
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    const parsed = ExtractionResultSchema.safeParse(body.data)
    expect(parsed.success).toBe(true)
  })

  it('provider error returns 502 EXTRACTION_PROVIDER_ERROR', async () => {
    const { ExtractionProviderError } = await import('../services/llm-provider.js')
    mockExtract.mockRejectedValueOnce(new ExtractionProviderError('Provider down'))

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/extract',
      headers: { authorization: `Bearer ${token}` },
      payload: { text: 'some task' },
    })

    expect(response.statusCode).toBe(502)
    expect(response.json().error.code).toBe('EXTRACTION_PROVIDER_ERROR')
  })

  it('timeout returns 408 EXTRACTION_TIMEOUT', async () => {
    const { ExtractionTimeoutError } = await import('../services/llm-provider.js')
    mockExtract.mockRejectedValueOnce(new ExtractionTimeoutError())

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/extract',
      headers: { authorization: `Bearer ${token}` },
      payload: { text: 'some task' },
    })

    expect(response.statusCode).toBe(408)
    expect(response.json().error.code).toBe('EXTRACTION_TIMEOUT')
  })
})

describe('extract route rate limiting', () => {
  let rateLimitFastify: FastifyInstance

  beforeAll(async () => {
    const { buildServer } = await import('../server.js')
    rateLimitFastify = buildServer()
    await rateLimitFastify.ready()
  })

  afterAll(async () => {
    await rateLimitFastify.close()
  })

  it('returns 429 RATE_LIMITED after exceeding 30 requests per minute', async () => {
    mockExtract.mockResolvedValue(VALID_EXTRACTION)

    for (let i = 0; i < 30; i++) {
      const response = await rateLimitFastify.inject({
        method: 'POST',
        url: '/api/extract',
        headers: { authorization: `Bearer ${token}` },
        payload: { text: `task ${i}` },
      })
      expect(response.statusCode).toBe(200)
    }

    const limitedResponse = await rateLimitFastify.inject({
      method: 'POST',
      url: '/api/extract',
      headers: { authorization: `Bearer ${token}` },
      payload: { text: 'task over limit' },
    })

    expect(limitedResponse.statusCode).toBe(429)
    expect(limitedResponse.json().error.code).toBe('RATE_LIMITED')
  })
})
