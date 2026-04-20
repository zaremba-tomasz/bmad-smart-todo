import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('$lib/api', () => ({
  api: {
    get: mockGet,
    post: mockPost,
  },
}))

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

vi.stubGlobal('localStorage', mockLocalStorage)

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

const TEMP_UUID = 'temp-uuid-1234'

let taskStore: typeof import('./task-store.svelte').taskStore

describe('taskStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.useFakeTimers()
    vi.stubGlobal('crypto', { randomUUID: () => TEMP_UUID })
    vi.stubGlobal('localStorage', mockLocalStorage)
    mockLocalStorage.getItem.mockReturnValue(null)

    vi.mock('$lib/api', () => ({
      api: {
        get: mockGet,
        post: mockPost,
      },
    }))
    ;({ taskStore } = await import('./task-store.svelte'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with empty tasks and loading=false', () => {
    expect(taskStore.tasks).toEqual([])
    expect(taskStore.loading).toBe(false)
    expect(taskStore.error).toBeNull()
    expect(taskStore.hasPendingMutations).toBe(false)
    expect(taskStore.pendingCount).toBe(0)
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
    })

    it('handles thrown errors and resets loading state', async () => {
      mockGet.mockRejectedValue(new Error('Network down'))

      await taskStore.loadTasks()

      expect(taskStore.loading).toBe(false)
      expect(taskStore.error).toBe('Network down')
      expect(taskStore.tasks).toEqual([])
    })

    it('replays pending mutations from localStorage before API fetch', async () => {
      const storedMutations = [
        {
          mutationId: 'pending-1:1',
          taskId: 'pending-1',
          type: 'create',
          payload: { title: 'Pending task', dueDate: null, dueTime: null, location: null, priority: null, groupId: null },
          createdAt: Date.now(),
          retryCount: 0,
        },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedMutations))

      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_A] },
      })
      mockPost.mockResolvedValue({
        ok: true,
        data: { data: { ...TASK_A, id: 'server-id-1', title: 'Pending task' } },
      })

      await taskStore.loadTasks()

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('smart-todo:pending-mutations')
      expect(taskStore.tasks.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('createTask — optimistic', () => {
    it('inserts task into local state immediately before API resolves', async () => {
      let resolveApi!: (value: unknown) => void
      mockPost.mockReturnValue(new Promise((r) => { resolveApi = r }))

      const createPromise = taskStore.createTask({
        title: 'Buy groceries',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      expect(taskStore.tasks).toHaveLength(1)
      expect(taskStore.tasks[0].title).toBe('Buy groceries')
      expect(taskStore.tasks[0].id).toBe(TEMP_UUID)
      expect(taskStore.getSyncStatus(TEMP_UUID)).toBe('pending')
      expect(taskStore.hasPendingMutations).toBe(true)

      resolveApi({
        ok: true,
        data: { data: { ...TASK_A, id: 'server-real-id' } },
      })
      await createPromise
    })

    it('updates sync status to synced and removes pending mutation on API success', async () => {
      mockPost.mockResolvedValue({
        ok: true,
        data: { data: { ...TASK_A, id: 'server-real-id' } },
      })

      await taskStore.createTask({
        title: 'Buy groceries',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      expect(taskStore.getSyncStatus('server-real-id')).toBe('synced')
      expect(taskStore.hasPendingMutations).toBe(false)
      expect(taskStore.tasks[0].id).toBe('server-real-id')
    })

    it('triggers retry on retryable API failure', async () => {
      mockPost.mockResolvedValue({
        ok: false,
        error: { code: 'SERVER_ERROR', message: 'Server error' },
      })

      await taskStore.createTask({
        title: 'Buy groceries',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      expect(taskStore.hasPendingMutations).toBe(true)
      expect(taskStore.getSyncStatus(TEMP_UUID)).toBe('pending')
      const mutation = taskStore.pendingMutations.find((m) => m.taskId === TEMP_UUID)
      expect(mutation?.retryCount).toBe(1)
    })

    it('rolls back local state on non-retryable error (VALIDATION_ERROR)', async () => {
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

      expect(taskStore.tasks).toEqual([])
      expect(taskStore.hasPendingMutations).toBe(false)
    })

    it('persists pending mutations to localStorage', async () => {
      let resolveApi!: (value: unknown) => void
      mockPost.mockReturnValue(new Promise((r) => { resolveApi = r }))

      const createPromise = taskStore.createTask({
        title: 'Buy groceries',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smart-todo:pending-mutations',
        expect.any(String),
      )
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(savedData).toHaveLength(1)
      expect(savedData[0].taskId).toBe(TEMP_UUID)
      expect(savedData[0].type).toBe('create')

      resolveApi({ ok: true, data: { data: TASK_A } })
      await createPromise
    })
  })

  describe('completeTask — optimistic', () => {
    it('applies optimistic state change immediately', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_A] },
      })
      await taskStore.loadTasks()

      let resolveApi!: (value: unknown) => void
      mockPost.mockReturnValue(new Promise((r) => { resolveApi = r }))

      const completePromise = taskStore.completeTask(TASK_A.id)

      expect(taskStore.tasks[0].isCompleted).toBe(true)
      expect(taskStore.tasks[0].completedAt).toBeTruthy()
      expect(taskStore.getSyncStatus(TASK_A.id)).toBe('pending')

      resolveApi({
        ok: true,
        data: { data: { ...TASK_A, isCompleted: true, completedAt: '2026-04-20T14:00:00Z' } },
      })
      await completePromise
    })

    it('sets synced status on API success', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_A] },
      })
      await taskStore.loadTasks()

      mockPost.mockResolvedValue({
        ok: true,
        data: { data: { ...TASK_A, isCompleted: true, completedAt: '2026-04-20T14:00:00Z' } },
      })

      await taskStore.completeTask(TASK_A.id)

      expect(taskStore.getSyncStatus(TASK_A.id)).toBe('synced')
      expect(taskStore.hasPendingMutations).toBe(false)
    })
  })

  describe('uncompleteTask — optimistic', () => {
    it('applies optimistic state change immediately', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        data: { data: [TASK_B] },
      })
      await taskStore.loadTasks()

      let resolveApi!: (value: unknown) => void
      mockPost.mockReturnValue(new Promise((r) => { resolveApi = r }))

      const uncompletePromise = taskStore.uncompleteTask(TASK_B.id)

      expect(taskStore.tasks[0].isCompleted).toBe(false)
      expect(taskStore.tasks[0].completedAt).toBeNull()
      expect(taskStore.getSyncStatus(TASK_B.id)).toBe('pending')

      resolveApi({
        ok: true,
        data: { data: { ...TASK_B, isCompleted: false, completedAt: null } },
      })
      await uncompletePromise
    })
  })

  describe('retry logic', () => {
    it('retryMutation re-executes a specific pending mutation', async () => {
      mockPost
        .mockResolvedValueOnce({
          ok: false,
          error: { code: 'SERVER_ERROR', message: 'Server error' },
        })

      await taskStore.createTask({
        title: 'Retry me',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      expect(taskStore.hasPendingMutations).toBe(true)

      mockPost.mockResolvedValueOnce({
        ok: true,
        data: { data: { ...TASK_A, id: 'server-id-retry', title: 'Retry me' } },
      })

      taskStore.retryMutation(TEMP_UUID)
      await vi.advanceTimersByTimeAsync(0)

      expect(taskStore.hasPendingMutations).toBe(false)
      expect(taskStore.getSyncStatus('server-id-retry')).toBe('synced')
    })

    it('schedules retry with exponential backoff on retryable errors', async () => {
      mockPost.mockResolvedValue({
        ok: false,
        error: { code: 'SERVER_ERROR', message: 'Server error' },
      })

      await taskStore.createTask({
        title: 'Backoff test',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      const callCountAfterFirst = mockPost.mock.calls.length
      expect(taskStore.pendingMutations[0].retryCount).toBe(1)

      await vi.advanceTimersByTimeAsync(5_000)
      expect(mockPost.mock.calls.length).toBeGreaterThan(callCountAfterFirst)
    })

    it('stops retrying after 3 attempts but keeps task as pending', async () => {
      mockPost.mockResolvedValue({
        ok: false,
        error: { code: 'SERVER_ERROR', message: 'Server error' },
      })

      await taskStore.createTask({
        title: 'Max retry',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      await vi.advanceTimersByTimeAsync(5_000)
      await vi.advanceTimersByTimeAsync(15_000)
      await vi.advanceTimersByTimeAsync(30_000)

      expect(taskStore.hasPendingMutations).toBe(true)
      expect(taskStore.tasks).toHaveLength(1)
      expect(taskStore.getSyncStatus(TEMP_UUID)).toBe('pending')
    })
  })

  describe('online/offline', () => {
    it('online event triggers retryAllPending', async () => {
      mockPost
        .mockResolvedValueOnce({
          ok: false,
          error: { code: 'SERVER_ERROR', message: 'Server error' },
        })

      await taskStore.createTask({
        title: 'Offline task',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })

      expect(taskStore.hasPendingMutations).toBe(true)
      const callCountBefore = mockPost.mock.calls.length

      mockPost.mockResolvedValue({
        ok: true,
        data: { data: { ...TASK_A, id: 'server-online', title: 'Offline task' } },
      })

      window.dispatchEvent(new Event('online'))
      await vi.advanceTimersByTimeAsync(0)

      expect(mockPost.mock.calls.length).toBeGreaterThan(callCountBefore)
      expect(taskStore.hasPendingMutations).toBe(false)
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
