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

let authMiddleware: typeof import('./auth').authMiddleware
let clearVerificationCache: typeof import('./auth').clearVerificationCache

describe('auth middleware', () => {
  let fastify: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.mock('../utils/supabase.js', () => ({
      getSupabaseAdmin: () => ({
        auth: { getUser: mockGetUser },
      }),
      createSupabaseClient: vi.fn().mockReturnValue({ from: vi.fn() }),
    }))
    ;({ authMiddleware, clearVerificationCache } = await import('./auth'))
    clearVerificationCache()

    fastify = Fastify()

    fastify.addHook('preHandler', authMiddleware)
    fastify.get('/api/test', async (request) => {
      return { userId: request.userId }
    })
    await fastify.ready()
  })

  afterEach(async () => {
    clearVerificationCache()
    await fastify.close()
  })

  it('returns 401 when no Authorization header is present', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/test',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
    })
  })

  it('returns 401 when Authorization header is not Bearer scheme', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/test',
      headers: { authorization: 'Basic abc123' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns 401 when token verification fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    })

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/test',
      headers: { authorization: 'Bearer invalid-token' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('UNAUTHORIZED')
  })

  it('authenticates request and decorates with userId on valid token', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-123' } },
      error: null,
    })

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/test',
      headers: { authorization: 'Bearer valid-token' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ userId: 'user-uuid-123' })
  })

  it('extracts userId exclusively from verified JWT, not from request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'jwt-user-id' } },
      error: null,
    })

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/test?userId=attacker-id',
      headers: { authorization: 'Bearer valid-token' },
    })

    expect(response.json().userId).toBe('jwt-user-id')
  })

  it('uses cached verification for subsequent requests with same token', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-123' } },
      error: null,
    })

    await fastify.inject({
      method: 'GET',
      url: '/api/test',
      headers: { authorization: 'Bearer cached-token' },
    })

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/test',
      headers: { authorization: 'Bearer cached-token' },
    })

    expect(mockGetUser).toHaveBeenCalledOnce()
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ userId: 'user-uuid-123' })
  })

  it('re-verifies token after cache expires', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-123' } },
      error: null,
    })

    await fastify.inject({
      method: 'GET',
      url: '/api/test',
      headers: { authorization: 'Bearer expiring-token' },
    })

    clearVerificationCache()

    await fastify.inject({
      method: 'GET',
      url: '/api/test',
      headers: { authorization: 'Bearer expiring-token' },
    })

    expect(mockGetUser).toHaveBeenCalledTimes(2)
  })

  it('uses { error } format matching ApiErrorSchema', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/test',
    })

    const body = response.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toHaveProperty('code')
    expect(body.error).toHaveProperty('message')
    expect(typeof body.error.code).toBe('string')
    expect(typeof body.error.message).toBe('string')
  })
})
