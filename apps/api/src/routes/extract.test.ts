import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetUser = vi.fn()

vi.mock('../utils/supabase.js', () => ({
  getSupabaseAdmin: () => ({
    auth: { getUser: mockGetUser },
  }),
  createSupabaseClient: vi.fn().mockReturnValue({ from: vi.fn() }),
}))

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

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const VALID_TOKEN = 'valid-token'

const VALID_EXTRACTION = {
  title: 'Call the dentist',
  dueDate: '2026-04-27',
  dueTime: null,
  location: null,
  priority: 'high',
  recurrence: null,
}

describe('extract routes', () => {
  let fastify: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.stubEnv('LLM_PROVIDER', 'openrouter')
    vi.stubEnv('OPENROUTER_MODEL', 'meta-llama/llama-3.1-70b-instruct')

    vi.mock('../utils/supabase.js', () => ({
      getSupabaseAdmin: () => ({
        auth: { getUser: mockGetUser },
      }),
      createSupabaseClient: vi.fn().mockReturnValue({ from: vi.fn() }),
    }))

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

    mockGetUser.mockImplementation(async (token: string) => {
      if (token === VALID_TOKEN) {
        return { data: { user: { id: USER_ID } }, error: null }
      }
      return { data: { user: null }, error: { message: 'Invalid token' } }
    })

    const { authMiddleware, clearVerificationCache } = await import('../middleware/auth.js')
    clearVerificationCache()
    const { extractRoutes } = await import('./extract.js')

    fastify = Fastify()
    fastify.addHook('onRequest', async (request, reply) => {
      const routePath = request.url
      if (!routePath.startsWith('/api/') || routePath === '/api/health') return
      return authMiddleware(request, reply)
    })
    await fastify.register(rateLimit, {
      global: false,
      keyGenerator: (request) => request.userId,
      hook: 'preHandler',
      errorResponseBuilder: (_request, context) => ({
        statusCode: context.statusCode,
        error: { code: 'RATE_LIMITED', message: 'Too many extraction requests. Try again later.' },
      }),
    })
    await fastify.register(extractRoutes)
    await fastify.ready()
  })

  afterEach(async () => {
    const { clearVerificationCache } = await import('../middleware/auth.js')
    clearVerificationCache()
    vi.unstubAllEnvs()
    await fastify.close()
  })

  describe('POST /api/extract', () => {
    it('returns extracted data on success', async () => {
      mockExtract.mockResolvedValueOnce(VALID_EXTRACTION)

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/extract',
        headers: { authorization: `Bearer ${VALID_TOKEN}` },
        payload: { text: 'Call the dentist next Monday, high priority' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toEqual(VALID_EXTRACTION)
    })

    it('returns data with all nullable fields explicitly null', async () => {
      const minimalExtraction = {
        title: 'Do laundry',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        recurrence: null,
      }
      mockExtract.mockResolvedValueOnce(minimalExtraction)

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/extract',
        headers: { authorization: `Bearer ${VALID_TOKEN}` },
        payload: { text: 'Do laundry' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.dueDate).toBeNull()
      expect(body.data.dueTime).toBeNull()
      expect(body.data.location).toBeNull()
      expect(body.data.priority).toBeNull()
      expect(body.data.recurrence).toBeNull()
    })

    it('returns 400 VALIDATION_ERROR when text is missing', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/extract',
        headers: { authorization: `Bearer ${VALID_TOKEN}` },
        payload: {},
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('returns 400 VALIDATION_ERROR when text is empty string', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/extract',
        headers: { authorization: `Bearer ${VALID_TOKEN}` },
        payload: { text: '' },
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('returns 422 EXTRACTION_VALIDATION_FAILED when LLM returns invalid schema', async () => {
      mockExtract.mockResolvedValueOnce({ invalid: 'data' })

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/extract',
        headers: { authorization: `Bearer ${VALID_TOKEN}` },
        payload: { text: 'some task' },
      })

      expect(response.statusCode).toBe(422)
      const body = response.json()
      expect(body.error.code).toBe('EXTRACTION_VALIDATION_FAILED')
    })

    it('returns 408 EXTRACTION_TIMEOUT when provider times out', async () => {
      const { ExtractionTimeoutError } = await import('../services/llm-provider.js')
      mockExtract.mockRejectedValueOnce(new ExtractionTimeoutError())

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/extract',
        headers: { authorization: `Bearer ${VALID_TOKEN}` },
        payload: { text: 'some task' },
      })

      expect(response.statusCode).toBe(408)
      const body = response.json()
      expect(body.error.code).toBe('EXTRACTION_TIMEOUT')
    })

    it('returns 502 EXTRACTION_PROVIDER_ERROR when provider fails', async () => {
      const { ExtractionProviderError } = await import('../services/llm-provider.js')
      mockExtract.mockRejectedValueOnce(new ExtractionProviderError('Model unavailable'))

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/extract',
        headers: { authorization: `Bearer ${VALID_TOKEN}` },
        payload: { text: 'some task' },
      })

      expect(response.statusCode).toBe(502)
      const body = response.json()
      expect(body.error.code).toBe('EXTRACTION_PROVIDER_ERROR')
    })

    it('returns 429 RATE_LIMITED after exceeding 30 requests per minute for same user', async () => {
      mockExtract.mockResolvedValue(VALID_EXTRACTION)

      const localFastify = Fastify()
      localFastify.addHook('onRequest', async (request) => {
        request.userId = USER_ID
      })
      await localFastify.register(rateLimit, {
        global: false,
        keyGenerator: (request) => request.userId,
        hook: 'preHandler',
        errorResponseBuilder: (_request, context) => ({
          statusCode: context.statusCode,
          error: { code: 'RATE_LIMITED', message: 'Too many extraction requests. Try again later.' },
        }),
      })
      const { extractRoutes } = await import('./extract.js')
      await localFastify.register(extractRoutes)
      await localFastify.ready()

      for (let i = 0; i < 30; i += 1) {
        const response = await localFastify.inject({
          method: 'POST',
          url: '/api/extract',
          payload: { text: `task ${i}` },
        })

        expect(response.statusCode).toBe(200)
      }

      const limitedResponse = await localFastify.inject({
        method: 'POST',
        url: '/api/extract',
        payload: { text: 'task over limit' },
      })

      expect(limitedResponse.statusCode).toBe(429)
      expect(limitedResponse.json().error.code).toBe('RATE_LIMITED')

      await localFastify.close()
    })

    it('logs structured Pino entry on success', async () => {
      const logSpy = vi.fn()
      mockExtract.mockReset()
      mockExtract.mockResolvedValueOnce(VALID_EXTRACTION)

      const localFastify = Fastify()
      localFastify.addHook('preHandler', async (request) => {
        request.userId = USER_ID
      })
      localFastify.addHook('onRequest', async (request) => {
        request.log.info = logSpy
      })
      const { extractRoutes } = await import('./extract.js')
      await localFastify.register(extractRoutes)
      await localFastify.ready()

      await localFastify.inject({
        method: 'POST',
        url: '/api/extract',
        payload: { text: 'Call the dentist' },
      })

      const extractionLog = logSpy.mock.calls.find(
        (call) => call[0]?.event === 'extraction',
      )
      expect(extractionLog).toBeDefined()
      expect(extractionLog![0].event).toBe('extraction')
      expect(extractionLog![0].status).toBe('success')
      expect(extractionLog![0].duration_ms).toBeTypeOf('number')
      expect(extractionLog![0].model).toBeDefined()
      expect(extractionLog![0].provider).toBe('openrouter')

      await localFastify.close()
    })

    it('logs structured Pino entry on timeout', async () => {
      const logSpy = vi.fn()
      const { ExtractionTimeoutError } = await import('../services/llm-provider.js')
      mockExtract.mockReset()
      mockExtract.mockRejectedValueOnce(new ExtractionTimeoutError())

      const localFastify = Fastify()
      localFastify.addHook('preHandler', async (request) => {
        request.userId = USER_ID
      })
      localFastify.addHook('onRequest', async (request) => {
        request.log.info = logSpy
      })
      const { extractRoutes } = await import('./extract.js')
      await localFastify.register(extractRoutes)
      await localFastify.ready()

      await localFastify.inject({
        method: 'POST',
        url: '/api/extract',
        payload: { text: 'some task' },
      })

      const extractionLog = logSpy.mock.calls.find(
        (call) => call[0]?.event === 'extraction',
      )
      expect(extractionLog).toBeDefined()
      expect(extractionLog![0].status).toBe('timeout')
      expect(extractionLog![0].duration_ms).toBeTypeOf('number')

      await localFastify.close()
    })

    it('logs structured Pino entry on validation failure', async () => {
      const logSpy = vi.fn()
      mockExtract.mockReset()
      mockExtract.mockResolvedValueOnce({ invalid: 'data' })

      const localFastify = Fastify()
      localFastify.addHook('preHandler', async (request) => {
        request.userId = USER_ID
      })
      localFastify.addHook('onRequest', async (request) => {
        request.log.info = logSpy
      })
      const { extractRoutes } = await import('./extract.js')
      await localFastify.register(extractRoutes)
      await localFastify.ready()

      await localFastify.inject({
        method: 'POST',
        url: '/api/extract',
        payload: { text: 'some task' },
      })

      const extractionLog = logSpy.mock.calls.find(
        (call) => call[0]?.event === 'extraction',
      )
      expect(extractionLog).toBeDefined()
      expect(extractionLog![0].status).toBe('validation_failed')

      await localFastify.close()
    })
  })

  describe('authentication', () => {
    it('returns 401 for unauthenticated request', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/extract',
        payload: { text: 'some task' },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().error.code).toBe('UNAUTHORIZED')
    })

    it('returns 401 for invalid token', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/extract',
        headers: { authorization: 'Bearer invalid-token' },
        payload: { text: 'some task' },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().error.code).toBe('UNAUTHORIZED')
    })
  })
})
