import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('$lib/api', () => ({
  api: {
    get: mockGet,
    post: mockPost,
  },
}))

const TASK_A = {
  id: 'aaa-111',
  userId: 'user-1',
  title: 'Buy groceries',
  dueDate: null,
  dueTime: null,
  location: null,
  priority: null,
  groupId: null,
  isCompleted: false,
  completedAt: null,
  deletedAt: null,
  createdAt: '2026-04-20T10:00:00Z',
}

const TASK_B = {
  id: 'bbb-222',
  userId: 'user-1',
  title: 'Walk the dog',
  dueDate: '2026-04-21',
  dueTime: null,
  location: null,
  priority: 'high' as const,
  groupId: null,
  isCompleted: true,
  completedAt: '2026-04-20T15:00:00Z',
  deletedAt: null,
  createdAt: '2026-04-20T09:00:00Z',
}

let taskStore: typeof import('./task-store.svelte').taskStore

describe('taskStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.mock('$lib/api', () => ({
      api: {
        get: mockGet,
        post: mockPost,
      },
    }))
    ;({ taskStore } = await import('./task-store.svelte'))
  })

  it('starts with empty tasks and loading=false', () => {
    expect(taskStore.tasks).toEqual([])
    expect(taskStore.loading).toBe(false)
    expect(taskStore.error).toBeNull()
  })

  describe('loadTasks', () => {
    it('populates tasks from API response', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_A, TASK_B] },
      })

      await taskStore.loadTasks()

      expect(taskStore.tasks).toEqual([TASK_A, TASK_B])
      expect(taskStore.loading).toBe(false)
    })

    it('sets error on API failure without corrupting state', async () => {
      mockGet.mockResolvedValueOnce({
        ok: true,
        data: { data: [TASK_A] },
      })
      await taskStore.loadTasks()

      mockGet.mockResolvedValueOnce({
        ok: false,
        error: { code: 'SERVER_ERROR', message: 'Connection failed' },
      })
      await taskStore.loadTasks()

      expect(taskStore.error).toBe('Connection failed')
      expect(taskStore.tasks).toEqual([TASK_A])
    })

    it('handles thrown errors and resets loading state', async () => {
      mockGet.mockRejectedValue(new Error('Network down'))

      await taskStore.loadTasks()

      expect(taskStore.loading).toBe(false)
      expect(taskStore.error).toBe('Network down')
      expect(taskStore.tasks).toEqual([])
    })
  })

  describe('createTask', () => {
    it('adds task to local state', async () => {
      mockPost.mockResolvedValue({
        ok: true,
        data: { data: TASK_A },
      })

      await taskStore.createTask({
        title: 'Buy groceries',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      expect(taskStore.tasks).toEqual([TASK_A])
      expect(mockPost).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({ title: 'Buy groceries' }),
        expect.anything(),
      )
    })

    it('prepends new task to beginning of list', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_B] },
      })
      await taskStore.loadTasks()

      mockPost.mockResolvedValue({
        ok: true,
        data: { data: TASK_A },
      })
      await taskStore.createTask({
        title: 'Buy groceries',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      expect(taskStore.tasks[0]).toEqual(TASK_A)
      expect(taskStore.tasks).toHaveLength(2)
    })

    it('sets error on API failure without corrupting state', async () => {
      mockPost.mockResolvedValue({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Title is required' },
      })

      await taskStore.createTask({
        title: '',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      expect(taskStore.error).toBe('Title is required')
      expect(taskStore.tasks).toEqual([])
    })

    it('handles thrown errors without corrupting state', async () => {
      mockPost.mockRejectedValue(new Error('Request failed'))

      await taskStore.createTask({
        title: 'Buy groceries',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      expect(taskStore.error).toBe('Request failed')
      expect(taskStore.tasks).toEqual([])
    })
  })

  describe('completeTask', () => {
    it('updates task state locally', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_A] },
      })
      await taskStore.loadTasks()

      const completedTask = { ...TASK_A, isCompleted: true, completedAt: '2026-04-20T14:00:00Z' }
      mockPost.mockResolvedValue({
        ok: true,
        data: { data: completedTask },
      })

      await taskStore.completeTask(TASK_A.id)

      expect(taskStore.tasks[0].isCompleted).toBe(true)
      expect(taskStore.tasks[0].completedAt).toBe('2026-04-20T14:00:00Z')
    })

    it('sets error on failure without corrupting state', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_A] },
      })
      await taskStore.loadTasks()

      mockPost.mockResolvedValue({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' },
      })

      await taskStore.completeTask(TASK_A.id)

      expect(taskStore.error).toBe('Task not found')
      expect(taskStore.tasks[0].isCompleted).toBe(false)
    })
  })

  describe('uncompleteTask', () => {
    it('updates task state locally', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_B] },
      })
      await taskStore.loadTasks()

      const uncompletedTask = { ...TASK_B, isCompleted: false, completedAt: null }
      mockPost.mockResolvedValue({
        ok: true,
        data: { data: uncompletedTask },
      })

      await taskStore.uncompleteTask(TASK_B.id)

      expect(taskStore.tasks[0].isCompleted).toBe(false)
      expect(taskStore.tasks[0].completedAt).toBeNull()
    })

    it('sets error on failure without corrupting state', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_B] },
      })
      await taskStore.loadTasks()

      mockPost.mockResolvedValue({
        ok: false,
        error: { code: 'SERVER_ERROR', message: 'Server error' },
      })

      await taskStore.uncompleteTask(TASK_B.id)

      expect(taskStore.error).toBe('Server error')
      expect(taskStore.tasks[0].isCompleted).toBe(true)
    })
  })

  describe('computed properties', () => {
    it('openTasks returns only non-completed tasks', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_A, TASK_B] },
      })
      await taskStore.loadTasks()

      expect(taskStore.openTasks).toEqual([TASK_A])
    })

    it('completedTasks returns only completed tasks', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_A, TASK_B] },
      })
      await taskStore.loadTasks()

      expect(taskStore.completedTasks).toEqual([TASK_B])
    })

    it('completedCount returns count of completed tasks', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_A, TASK_B] },
      })
      await taskStore.loadTasks()

      expect(taskStore.completedCount).toBe(1)
    })
  })
})
