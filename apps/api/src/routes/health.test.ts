import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { healthRoutes } from './health.js'

describe('GET /api/health', () => {
  let fastify: FastifyInstance

  beforeEach(async () => {
    fastify = Fastify()
    await fastify.register(healthRoutes)
    await fastify.ready()
  })

  afterEach(async () => {
    await fastify.close()
  })

  it('returns status ok', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
