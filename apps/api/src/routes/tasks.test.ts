import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFrom = vi.fn()
const mockSupabaseClientA = { from: mockFrom }
const mockSupabaseClientB = { from: vi.fn() }

const mockGetUser = vi.fn()

vi.mock('../utils/supabase.js', () => ({
  getSupabaseAdmin: () => ({
    auth: { getUser: mockGetUser },
  }),
  createSupabaseClient: vi.fn().mockReturnValue(mockSupabaseClientA),
}))

const USER_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const USER_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const TASK_ID = '11111111-1111-1111-1111-111111111111'

const VALID_TOKEN_A = 'valid-token-a'
const VALID_TOKEN_B = 'valid-token-b'

function makeTaskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TASK_ID,
    user_id: USER_A_ID,
    title: 'Buy groceries',
    due_date: null,
    due_time: null,
    location: null,
    priority: null,
    group_id: null,
    is_completed: false,
    completed_at: null,
    deleted_at: null,
    created_at: '2026-04-20T10:00:00Z',
    ...overrides,
  }
}

function mockInsertChain(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  return { insert }
}

function mockSelectChain(result: { data: unknown; error: unknown }) {
  const is = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ is })
  return { select }
}

function mockUpdateChain(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const is = vi.fn().mockReturnValue({ select })
  const eq = vi.fn().mockReturnValue({ is })
  const update = vi.fn().mockReturnValue({ eq })
  return { update }
}

describe('task routes', () => {
  let fastify: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.mock('../utils/supabase.js', () => ({
      getSupabaseAdmin: () => ({
        auth: { getUser: mockGetUser },
      }),
      createSupabaseClient: vi.fn().mockReturnValue(mockSupabaseClientA),
    }))

    mockGetUser.mockImplementation(async (token: string) => {
      if (token === VALID_TOKEN_A) {
        return { data: { user: { id: USER_A_ID } }, error: null }
      }
      if (token === VALID_TOKEN_B) {
        return { data: { user: { id: USER_B_ID } }, error: null }
      }
      return { data: { user: null }, error: { message: 'Invalid token' } }
    })

    const { authMiddleware, clearVerificationCache } = await import('../middleware/auth.js')
    clearVerificationCache()
    const { taskRoutes } = await import('./tasks.js')

    fastify = Fastify()
    fastify.addHook('preHandler', async (request, reply) => {
      const routePath = request.routeOptions.url ?? request.url
      if (!routePath.startsWith('/api/') || routePath === '/api/health') return
      return authMiddleware(request, reply)
    })
    await fastify.register(taskRoutes)
    await fastify.ready()
  })

  afterEach(async () => {
    const { clearVerificationCache } = await import('../middleware/auth.js')
    clearVerificationCache()
    await fastify.close()
  })

  describe('POST /api/tasks', () => {
    it('creates a task with valid body and returns 201 with camelCase response', async () => {
      const taskRow = makeTaskRow()
      mockFrom.mockReturnValue(mockInsertChain({ data: taskRow, error: null }))

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
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
      expect(body.data).toBeDefined()
      expect(body.data.title).toBe('Buy groceries')
      expect(body.data.userId).toBe(USER_A_ID)
      expect(body.data.isCompleted).toBe(false)
      expect(body.data).not.toHaveProperty('user_id')
      expect(body.data).not.toHaveProperty('is_completed')
    })

    it('returns 400 with VALIDATION_ERROR when title is missing', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
        payload: {
          dueDate: null,
          dueTime: null,
          location: null,
          priority: null,
          groupId: null,
        },
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/tasks', () => {
    it('returns non-deleted tasks sorted by priority then due_date', async () => {
      const rows = [
        makeTaskRow({ id: '11111111-1111-1111-1111-111111111111', priority: 'low', due_date: '2026-04-22' }),
        makeTaskRow({ id: '22222222-2222-2222-2222-222222222222', priority: 'urgent', due_date: null }),
        makeTaskRow({ id: '33333333-3333-3333-3333-333333333333', priority: 'high', due_date: '2026-04-21' }),
        makeTaskRow({ id: '44444444-4444-4444-4444-444444444444', priority: 'high', due_date: '2026-04-20' }),
      ]

      mockFrom.mockReturnValue(mockSelectChain({ data: rows, error: null }))

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toHaveLength(4)
      expect(body.data[0].priority).toBe('urgent')
      expect(body.data[1].priority).toBe('high')
      expect(body.data[1].dueDate).toBe('2026-04-20')
      expect(body.data[2].priority).toBe('high')
      expect(body.data[2].dueDate).toBe('2026-04-21')
      expect(body.data[3].priority).toBe('low')
    })
  })

  describe('POST /api/tasks/:id/complete', () => {
    it('sets isCompleted and completedAt', async () => {
      const completedRow = makeTaskRow({
        is_completed: true,
        completed_at: '2026-04-20T12:00:00Z',
      })
      mockFrom.mockReturnValue(mockUpdateChain({ data: completedRow, error: null }))

      const response = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${TASK_ID}/complete`,
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.isCompleted).toBe(true)
      expect(body.data.completedAt).toBeTruthy()
    })

    it('returns 400 when task id is not a valid UUID', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tasks/not-a-uuid/complete',
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('VALIDATION_ERROR')
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('returns 404 when task is not found or soft-deleted', async () => {
      mockFrom.mockReturnValue(
        mockUpdateChain({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      )

      const response = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${TASK_ID}/complete`,
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
      })

      expect(response.statusCode).toBe(404)
      expect(response.json().error.code).toBe('NOT_FOUND')
    })

    it('returns 500 when database update fails', async () => {
      mockFrom.mockReturnValue(
        mockUpdateChain({
          data: null,
          error: { code: 'XX000', message: 'Database unavailable' },
        }),
      )

      const response = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${TASK_ID}/complete`,
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
      })

      expect(response.statusCode).toBe(500)
      expect(response.json().error.code).toBe('SERVER_ERROR')
    })
  })

  describe('POST /api/tasks/:id/uncomplete', () => {
    it('clears isCompleted and completedAt', async () => {
      const uncompletedRow = makeTaskRow({
        is_completed: false,
        completed_at: null,
      })
      mockFrom.mockReturnValue(mockUpdateChain({ data: uncompletedRow, error: null }))

      const response = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${TASK_ID}/uncomplete`,
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.isCompleted).toBe(false)
      expect(body.data.completedAt).toBeNull()
    })

    it('returns 400 when task id is not a valid UUID', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tasks/not-a-uuid/uncomplete',
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('VALIDATION_ERROR')
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('returns 404 when task is not found or soft-deleted', async () => {
      mockFrom.mockReturnValue(
        mockUpdateChain({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      )

      const response = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${TASK_ID}/uncomplete`,
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
      })

      expect(response.statusCode).toBe(404)
      expect(response.json().error.code).toBe('NOT_FOUND')
    })

    it('returns 500 when database update fails', async () => {
      mockFrom.mockReturnValue(
        mockUpdateChain({
          data: null,
          error: { code: 'XX000', message: 'Database unavailable' },
        }),
      )

      const response = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${TASK_ID}/uncomplete`,
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
      })

      expect(response.statusCode).toBe(500)
      expect(response.json().error.code).toBe('SERVER_ERROR')
    })
  })

  describe('authentication', () => {
    it('returns 401 for unauthenticated request', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/tasks',
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('RLS isolation', () => {
    it('user A cannot access user B tasks and cannot mutate user A task', async () => {
      const { createSupabaseClient } = await import('../utils/supabase.js')

      vi.mocked(createSupabaseClient).mockImplementation((jwt: string) => {
        if (jwt === VALID_TOKEN_B) return mockSupabaseClientB as never
        return mockSupabaseClientA as never
      })

      const insertRow = makeTaskRow({ user_id: USER_A_ID })
      mockFrom.mockReturnValue(mockInsertChain({ data: insertRow, error: null }))

      await fastify.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${VALID_TOKEN_A}` },
        payload: {
          title: 'Secret task',
          dueDate: null,
          dueTime: null,
          location: null,
          priority: null,
          groupId: null,
        },
      })

      mockSupabaseClientB.from.mockReturnValue(
        mockSelectChain({ data: [], error: null }),
      )

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${VALID_TOKEN_B}` },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data).toEqual([])

      mockSupabaseClientB.from.mockReturnValue(
        mockUpdateChain({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      )

      const mutationResponse = await fastify.inject({
        method: 'POST',
        url: `/api/tasks/${TASK_ID}/complete`,
        headers: { authorization: `Bearer ${VALID_TOKEN_B}` },
      })

      expect(mutationResponse.statusCode).toBe(404)
      expect(mutationResponse.json().error.code).toBe('NOT_FOUND')
    })
  })
})
