import { TaskSchema } from '@smart-todo/shared'
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

const TEST_EMAIL_A = 'int-tasks-a@test.local'

let fastify: FastifyInstance
let userIdA: string
let tokenA: string

beforeAll(async () => {
  setIntegrationEnv()
  fastify = buildServer()
  await fastify.ready()

  userIdA = await createTestUser(TEST_EMAIL_A)
  tokenA = await getTestUserToken(TEST_EMAIL_A)
})

afterEach(async () => {
  await cleanupTestTasks(userIdA)
})

afterAll(async () => {
  await cleanupTestTasks(userIdA)
  await cleanupTestUser(TEST_EMAIL_A)
  await fastify.close()
})

describe('task route integration tests', () => {
  describe('POST /api/tasks', () => {
    it('creates a task with valid body and returns 201', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          title: 'Buy groceries',
          dueDate: null,
          dueTime: null,
          location: null,
          priority: null,
          groupId: null,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.data.title).toBe('Buy groceries')
      expect(body.data.isCompleted).toBe(false)
      expect(body.data.userId).toBe(userIdA)

      const parsed = TaskSchema.safeParse(body.data)
      expect(parsed.success).toBe(true)
    })

    it('creates a task with all fields populated', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          title: 'Team meeting',
          dueDate: '2026-05-01',
          dueTime: '14:00',
          location: 'Conference Room B',
          priority: 'high',
          groupId: null,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.data.title).toBe('Team meeting')
      expect(body.data.dueDate).toBe('2026-05-01')
      expect(body.data.dueTime).toBe('14:00:00')
      expect(body.data.location).toBe('Conference Room B')
      expect(body.data.priority).toBe('high')

      const parsed = TaskSchema.safeParse(body.data)
      expect(parsed.success).toBe(true)
    })

    it('returns 400 VALIDATION_ERROR when title is missing', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          dueDate: null,
          dueTime: null,
          location: null,
          priority: null,
          groupId: null,
        },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/tasks', () => {
    it('returns only non-deleted tasks for the authenticated user, sorted by priority then due date', async () => {
      const tasks = [
        { title: 'Low task', dueDate: '2026-04-22', dueTime: null, location: null, priority: 'low', groupId: null },
        { title: 'Urgent task', dueDate: null, dueTime: null, location: null, priority: 'urgent', groupId: null },
        { title: 'High task early', dueDate: '2026-04-20', dueTime: null, location: null, priority: 'high', groupId: null },
        { title: 'High task late', dueDate: '2026-04-25', dueTime: null, location: null, priority: 'high', groupId: null },
      ]

      for (const task of tasks) {
        await fastify.inject({
          method: 'POST',
          url: '/api/tasks',
          headers: { authorization: `Bearer ${tokenA}` },
          payload: task,
        })
      }

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toHaveLength(4)
      expect(body.data[0].title).toBe('Urgent task')
      expect(body.data[1].title).toBe('High task early')
      expect(body.data[2].title).toBe('High task late')
      expect(body.data[3].title).toBe('Low task')

      for (const task of body.data) {
        const parsed = TaskSchema.safeParse(task)
        expect(parsed.success).toBe(true)
      }
    })

    it('does not return soft-deleted tasks', async () => {
      const createRes = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { title: 'Will be deleted', dueDate: null, dueTime: null, location: null, priority: null, groupId: null },
      })
      const taskId = createRes.json().data.id

      const { getTestSupabaseAdmin } = await import('../test-utils/integration-helpers.js')
      const admin = getTestSupabaseAdmin()
      await admin
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', taskId)

      const listRes = await fastify.inject({
        method: 'GET',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
      })

      expect(listRes.statusCode).toBe(200)
      const taskIds = listRes.json().data.map((t: { id: string }) => t.id)
      expect(taskIds).not.toContain(taskId)
    })
  })

  describe('POST /api/tasks/:id/complete', () => {
    it('sets is_completed=true and completed_at is a valid timestamp', async () => {
      const createRes = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { title: 'Complete me', dueDate: null, dueTime: null, location: null, priority: null, groupId: null },
      })
      const taskId = createRes.json().data.id

      const response = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${taskId}/complete`,
        headers: { authorization: `Bearer ${tokenA}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.isCompleted).toBe(true)
      expect(body.data.completedAt).toBeTruthy()
      expect(new Date(body.data.completedAt).getTime()).not.toBeNaN()
    })

    it('returns 404 for non-existent task ID', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tasks/00000000-0000-0000-0000-000000000000/complete',
        headers: { authorization: `Bearer ${tokenA}` },
      })

      expect(response.statusCode).toBe(404)
      expect(response.json().error.code).toBe('NOT_FOUND')
    })

    it('returns 404 for soft-deleted task', async () => {
      const createRes = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { title: 'Soft deleted', dueDate: null, dueTime: null, location: null, priority: null, groupId: null },
      })
      const taskId = createRes.json().data.id

      const { getTestSupabaseAdmin } = await import('../test-utils/integration-helpers.js')
      const admin = getTestSupabaseAdmin()
      await admin
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', taskId)

      const response = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${taskId}/complete`,
        headers: { authorization: `Bearer ${tokenA}` },
      })

      expect(response.statusCode).toBe(404)
      expect(response.json().error.code).toBe('NOT_FOUND')
    })
  })

  describe('POST /api/tasks/:id/uncomplete', () => {
    it('clears is_completed and completed_at', async () => {
      const createRes = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { title: 'Uncomplete me', dueDate: null, dueTime: null, location: null, priority: null, groupId: null },
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
        headers: { authorization: `Bearer ${tokenA}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.isCompleted).toBe(false)
      expect(body.data.completedAt).toBeNull()
    })
  })

  describe('POST /api/tasks/:id — invalid UUID', () => {
    it('returns 400 for invalid UUID format', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tasks/not-a-uuid/complete',
        headers: { authorization: `Bearer ${tokenA}` },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('response shape validation', () => {
    it('all successful responses match TaskSchema (camelCase, nullable fields explicit)', async () => {
      const createRes = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { title: 'Schema test', dueDate: null, dueTime: null, location: null, priority: null, groupId: null },
      })
      expect(TaskSchema.safeParse(createRes.json().data).success).toBe(true)

      const listRes = await fastify.inject({
        method: 'GET',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${tokenA}` },
      })
      for (const task of listRes.json().data) {
        expect(TaskSchema.safeParse(task).success).toBe(true)
      }

      const taskId = createRes.json().data.id
      const completeRes = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${taskId}/complete`,
        headers: { authorization: `Bearer ${tokenA}` },
      })
      expect(TaskSchema.safeParse(completeRes.json().data).success).toBe(true)

      const uncompleteRes = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${taskId}/uncomplete`,
        headers: { authorization: `Bearer ${tokenA}` },
      })
      expect(TaskSchema.safeParse(uncompleteRes.json().data).success).toBe(true)
    })
  })
})
