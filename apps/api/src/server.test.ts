import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuthMiddleware = vi.fn()

vi.mock('./middleware/auth.js', () => ({
  authMiddleware: mockAuthMiddleware,
}))

let buildServer: typeof import('./server').buildServer

describe('server auth wiring', () => {
  let fastify: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.mock('./middleware/auth.js', () => ({
      authMiddleware: mockAuthMiddleware,
    }))

    ;({ buildServer } = await import('./server'))
    fastify = buildServer()
  })

  afterEach(async () => {
    await fastify.close()
  })

  it('keeps /api/health public', async () => {
    await fastify.ready()

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/health',
    })

    expect(response.statusCode).toBe(200)
    expect(mockAuthMiddleware).not.toHaveBeenCalled()
  })

  it('runs auth middleware for other /api routes', async () => {
    fastify.get('/api/protected', async () => ({ ok: true }))
    await fastify.ready()

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
      headers: { authorization: 'Bearer test-token' },
    })

    expect(response.statusCode).toBe(200)
    expect(mockAuthMiddleware).toHaveBeenCalledOnce()
  })
})
