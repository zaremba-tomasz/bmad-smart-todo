import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { buildServer } from '../server.js'
import {
  cleanupTestTasks,
  cleanupTestUser,
  createTestUser,
  getTestUserToken,
  setIntegrationEnv,
} from '../test-utils/integration-helpers.js'

const TEST_EMAIL_A = 'int-auth-a@test.local'
const TEST_EMAIL_B = 'int-auth-b@test.local'

let fastify: FastifyInstance
let userIdA: string
let userIdB: string
let tokenA: string
let tokenB: string

beforeAll(async () => {
  setIntegrationEnv()
  fastify = buildServer()
  await fastify.ready()

  userIdA = await createTestUser(TEST_EMAIL_A)
  userIdB = await createTestUser(TEST_EMAIL_B)
  tokenA = await getTestUserToken(TEST_EMAIL_A)
  tokenB = await getTestUserToken(TEST_EMAIL_B)
})

afterEach(async () => {
  await cleanupTestTasks(userIdA)
  await cleanupTestTasks(userIdB)
})

afterAll(async () => {
  await cleanupTestTasks(userIdA)
  await cleanupTestTasks(userIdB)
  await cleanupTestUser(TEST_EMAIL_A)
  await cleanupTestUser(TEST_EMAIL_B)
  await fastify.close()
})

describe('auth integration tests', () => {
  it('returns 401 UNAUTHORIZED when no Authorization header is present', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/tasks',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('UNAUTHORIZED')
  })

  it('returns 401 UNAUTHORIZED with invalid/expired token', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/tasks',
      headers: { authorization: 'Bearer invalid-expired-token-abc123' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('UNAUTHORIZED')
  })

  it('returns 200 with valid JWT and user_id extracted from token', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${tokenA}` },
    })

    expect(response.statusCode).toBe(200)
  })

  describe('cross-user RLS isolation', () => {
    it('User A creates a task — User B GET /api/tasks does NOT return it', async () => {
      await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          title: 'Secret task for User A',
          dueDate: null,
          dueTime: null,
          location: null,
          priority: null,
          groupId: null,
        },
      })

      const userBResponse = await fastify.inject({
        method: 'GET',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenB}` },
      })

      expect(userBResponse.statusCode).toBe(200)
      const titles = userBResponse.json().data.map((t: { title: string }) => t.title)
      expect(titles).not.toContain('Secret task for User A')
    })

    it('User B cannot complete User A task — returns 404 due to RLS', async () => {
      const createRes = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          title: 'User A only task',
          dueDate: null,
          dueTime: null,
          location: null,
          priority: null,
          groupId: null,
        },
      })
      const taskId = createRes.json().data.id

      const response = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${taskId}/complete`,
        headers: { authorization: `Bearer ${tokenB}` },
      })

      expect(response.statusCode).toBe(404)
      expect(response.json().error.code).toBe('NOT_FOUND')
    })

    it('User B cannot uncomplete User A task — returns 404 due to RLS', async () => {
      const createRes = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          title: 'User A complete test',
          dueDate: null,
          dueTime: null,
          location: null,
          priority: null,
          groupId: null,
        },
      })
      const taskId = createRes.json().data.id

      await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${taskId}/complete`,
        headers: { authorization: `Bearer ${tokenA}` },
      })

      const response = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${taskId}/uncomplete`,
        headers: { authorization: `Bearer ${tokenB}` },
      })

      expect(response.statusCode).toBe(404)
      expect(response.json().error.code).toBe('NOT_FOUND')
    })
  })

  describe('JWT verification cache', () => {
    it('second request with same token is faster (cache hit)', async () => {
      // First request — cold cache
      const start1 = performance.now()
      await fastify.inject({
        method: 'GET',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
      })
      const duration1 = performance.now() - start1

      // Second request — should use cache
      const start2 = performance.now()
      const response2 = await fastify.inject({
        method: 'GET',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
      })
      const duration2 = performance.now() - start2

      expect(response2.statusCode).toBe(200)
      // Cache hit should be noticeably faster; allow generous margin
      expect(duration2).toBeLessThan(duration1)
    })
  })
})
