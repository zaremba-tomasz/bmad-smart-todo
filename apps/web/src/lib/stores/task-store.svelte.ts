import type { Task, CreateTaskRequest } from '@smart-todo/shared'
import { TaskSchema, ApiSuccessSchema } from '@smart-todo/shared'
import { SvelteMap } from 'svelte/reactivity'
import { z } from 'zod'

import { api } from '$lib/api'
import type {
  SyncStatus,
  PendingMutation,
  UpdateMutationPayload,
} from '$lib/types'

const TaskListResponseSchema = ApiSuccessSchema(z.array(TaskSchema))
const TaskResponseSchema = ApiSuccessSchema(TaskSchema)

const STORAGE_KEY = 'smart-todo:pending-mutations'
const RETRY_DELAYS = [5_000, 15_000, 30_000]
const RETRYABLE_CODES = ['SERVER_ERROR', 'RATE_LIMITED']
const ONLINE_HANDLER_KEY = '__smartTodoOnlineHandler__'
const OFFLINE_HANDLER_KEY = '__smartTodoOfflineHandler__'

const CreateMutationSchema = z.object({
  mutationId: z.string(),
  taskId: z.string(),
  type: z.literal('create'),
  payload: z.object({
    title: z.string(),
    dueDate: z.string().nullable(),
    dueTime: z.string().nullable(),
    location: z.string().nullable(),
    priority: z.enum(['low', 'medium', 'high']).nullable(),
    groupId: z.string().nullable(),
  }),
  createdAt: z.number().int().nonnegative(),
  retryCount: z.number().int().nonnegative(),
})

const UpdateMutationSchema = z.object({
  mutationId: z.string(),
  taskId: z.string(),
  type: z.union([z.literal('complete'), z.literal('uncomplete')]),
  payload: z.object({
    id: z.string(),
    previousCompletedAt: z.string().nullable(),
  }),
  createdAt: z.number().int().nonnegative(),
  retryCount: z.number().int().nonnegative(),
})

const PendingMutationListSchema = z.array(
  z.union([CreateMutationSchema, UpdateMutationSchema]),
)

let tasks = $state<Task[]>([])
let loading = $state(false)
let error = $state<string | null>(null)
const syncStatus = new SvelteMap<string, SyncStatus>()
let pendingMutations = $state<PendingMutation[]>([])
let isOnline = $state(typeof navigator !== 'undefined' ? navigator.onLine : true)
let mutationSequence = 0

// eslint-disable-next-line svelte/prefer-svelte-reactivity -- non-reactive timer tracking
const retryTimers = new Map<string, ReturnType<typeof setTimeout>>()

function getErrorMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message
  return 'Request failed'
}

function isRetryableError(errorResult: { code: string }): boolean {
  return RETRYABLE_CODES.includes(errorResult.code)
}

function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError
}

function nextMutationId(taskId: string): string {
  mutationSequence += 1
  return `${taskId}:${mutationSequence}`
}

function savePendingMutations(): void {
  try {
    const snapshot = $state.snapshot(pendingMutations)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // localStorage may be unavailable
  }
}

function loadPendingMutationsFromStorage(): PendingMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const validated = PendingMutationListSchema.safeParse(parsed)
    if (!validated.success) return []
    return validated.data
  } catch {
    return []
  }
}

function removePendingMutation(mutationId: string): void {
  pendingMutations = pendingMutations.filter((m) => m.mutationId !== mutationId)
  savePendingMutations()
}

function addPendingMutation(mutation: PendingMutation): void {
  pendingMutations = [...pendingMutations, mutation]
  savePendingMutations()
}

function updatePendingMutation(mutationId: string, updates: Partial<PendingMutation>): void {
  pendingMutations = pendingMutations.map((m) =>
    m.mutationId === mutationId ? { ...m, ...updates } : m,
  )
  savePendingMutations()
}

function rollbackTask(taskId: string, mutationId: string): void {
  tasks = tasks.filter((t) => t.id !== taskId)
  syncStatus.delete(taskId)
  removePendingMutation(mutationId)
  clearRetryTimer(mutationId)
}

function rollbackMutationState(mutation: PendingMutation): void {
  if (mutation.type === 'create') {
    rollbackTask(mutation.taskId, mutation.mutationId)
  } else {
    const payload = mutation.payload as UpdateMutationPayload
    tasks = tasks.map((t) => {
      if (t.id !== mutation.taskId) return t

      if (mutation.type === 'complete') {
        return { ...t, isCompleted: false, completedAt: null }
      }

      return {
        ...t,
        isCompleted: true,
        completedAt: payload.previousCompletedAt,
      }
    })
    syncStatus.delete(mutation.taskId)
    removePendingMutation(mutation.mutationId)
    clearRetryTimer(mutation.mutationId)
  }
}

function clearRetryTimer(mutationId: string): void {
  const timer = retryTimers.get(mutationId)
  if (timer) {
    clearTimeout(timer)
    retryTimers.delete(mutationId)
  }
}

function scheduleRetry(mutation: PendingMutation): void {
  if (mutation.retryCount <= 0 || mutation.retryCount > RETRY_DELAYS.length) return
  clearRetryTimer(mutation.mutationId)

  const delay = RETRY_DELAYS[mutation.retryCount - 1]
  const timer = setTimeout(() => {
    retryTimers.delete(mutation.mutationId)
    executeMutation(mutation)
  }, delay)
  retryTimers.set(mutation.mutationId, timer)
}

async function executeMutation(mutation: PendingMutation): Promise<void> {
  try {
    let result

    if (mutation.type === 'create') {
      const payload = mutation.payload as CreateTaskRequest
      result = await api.post('/api/tasks', payload, TaskResponseSchema)
    } else if (mutation.type === 'complete') {
      result = await api.post(`/api/tasks/${mutation.taskId}/complete`, {}, TaskResponseSchema)
    } else {
      result = await api.post(`/api/tasks/${mutation.taskId}/uncomplete`, {}, TaskResponseSchema)
    }

    if (result.ok) {
      if (mutation.type === 'create') {
        const serverTask = result.data.data
        tasks = tasks.map((t) =>
          t.id === mutation.taskId ? serverTask : t,
        )
        syncStatus.delete(mutation.taskId)
        syncStatus.set(serverTask.id, 'synced')
      } else {
        tasks = tasks.map((t) =>
          t.id === mutation.taskId ? result.data.data : t,
        )
        syncStatus.set(mutation.taskId, 'synced')
      }
      removePendingMutation(mutation.mutationId)
      clearRetryTimer(mutation.mutationId)
    } else {
      if (isRetryableError(result.error)) {
        const nextRetry = mutation.retryCount + 1
        updatePendingMutation(mutation.mutationId, { retryCount: nextRetry })
        const updated = pendingMutations.find((m) => m.mutationId === mutation.mutationId)
        if (updated && updated.retryCount <= RETRY_DELAYS.length) {
          scheduleRetry(updated)
        }
      } else {
        rollbackMutationState(mutation)
      }
    }
  } catch (err) {
    if (isNetworkError(err)) {
      const nextRetry = mutation.retryCount + 1
      updatePendingMutation(mutation.mutationId, { retryCount: nextRetry })
      const updated = pendingMutations.find((m) => m.mutationId === mutation.mutationId)
      if (updated && updated.retryCount <= RETRY_DELAYS.length) {
        scheduleRetry(updated)
      }
    } else {
      rollbackMutationState(mutation)
    }
  }
}

async function retryAllPending(): Promise<void> {
  const current = [...pendingMutations]
  for (const mutation of current) {
    clearRetryTimer(mutation.mutationId)
    await executeMutation(mutation)
  }
}

function getLatestMutationForTask(taskId: string): PendingMutation | undefined {
  for (let index = pendingMutations.length - 1; index >= 0; index -= 1) {
    if (pendingMutations[index].taskId === taskId) return pendingMutations[index]
  }
  return undefined
}

function buildOptimisticTask(tempId: string, input: CreateTaskRequest): Task {
  return {
    id: tempId,
    userId: '',
    title: input.title,
    dueDate: input.dueDate,
    dueTime: input.dueTime,
    location: input.location,
    priority: input.priority,
    groupId: input.groupId,
    isCompleted: false,
    completedAt: null,
    deletedAt: null,
    createdAt: new Date().toISOString(),
  }
}

if (typeof window !== 'undefined') {
  const browserWindow = window as unknown as Window & Record<string, EventListener | undefined>
  const existingOnlineHandler = browserWindow[ONLINE_HANDLER_KEY]
  const existingOfflineHandler = browserWindow[OFFLINE_HANDLER_KEY]

  if (existingOnlineHandler) {
    window.removeEventListener('online', existingOnlineHandler)
  }
  if (existingOfflineHandler) {
    window.removeEventListener('offline', existingOfflineHandler)
  }

  const onlineHandler: EventListener = () => {
    isOnline = true
    retryAllPending()
  }
  const offlineHandler: EventListener = () => {
    isOnline = false
  }

  browserWindow[ONLINE_HANDLER_KEY] = onlineHandler
  browserWindow[OFFLINE_HANDLER_KEY] = offlineHandler
  window.addEventListener('online', onlineHandler)
  window.addEventListener('offline', offlineHandler)
}

export const taskStore = {
  get tasks() { return tasks },
  get loading() { return loading },
  get error() { return error },
  get openTasks() { return tasks.filter((t) => !t.isCompleted) },
  get completedTasks() { return tasks.filter((t) => t.isCompleted) },
  get completedCount() { return tasks.filter((t) => t.isCompleted).length },
  get isOnline() { return isOnline },
  get hasPendingMutations() { return pendingMutations.length > 0 },
  get pendingCount() { return pendingMutations.length },
  get pendingMutations() { return pendingMutations },

  getSyncStatus(taskId: string): SyncStatus {
    return syncStatus.get(taskId) ?? 'synced'
  },

  async loadTasks() {
    loading = true
    error = null
    try {
      const stored = loadPendingMutationsFromStorage()
      if (stored.length > 0) {
        pendingMutations = stored

        for (const mutation of stored) {
          if (mutation.type === 'create') {
            const payload = mutation.payload as CreateTaskRequest
            const optimistic = buildOptimisticTask(mutation.taskId, payload)
            const alreadyExists = tasks.some((t) => t.id === mutation.taskId)
            if (!alreadyExists) {
              tasks = [optimistic, ...tasks]
            }
            syncStatus.set(mutation.taskId, 'pending')
          } else {
            const payload = mutation.payload as UpdateMutationPayload
            tasks = tasks.map((t) =>
              t.id === mutation.taskId
                ? mutation.type === 'complete'
                  ? { ...t, isCompleted: true, completedAt: t.completedAt ?? new Date().toISOString() } // eslint-disable-line svelte/prefer-svelte-reactivity
                  : { ...t, isCompleted: false, completedAt: null }
                : t,
            )
            syncStatus.set(payload.id, 'pending')
          }
        }
      }

      await retryAllPending()

      const result = await api.get('/api/tasks', TaskListResponseSchema)
      if (result.ok) {
        const remainingPending = [...pendingMutations]
        const serverTasks = result.data.data
        // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local non-reactive lookup
        const pendingCreateIds = new Set(
          remainingPending
            .filter((m) => m.type === 'create')
            .map((m) => m.taskId),
        )

        const pendingCreateTasks = tasks.filter((t) => pendingCreateIds.has(t.id))
        tasks = [...pendingCreateTasks, ...serverTasks]

        for (const mutation of remainingPending) {
          if (mutation.type === 'complete') {
            tasks = tasks.map((t) =>
              t.id === mutation.taskId
                ? { ...t, isCompleted: true, completedAt: t.completedAt ?? new Date().toISOString() } // eslint-disable-line svelte/prefer-svelte-reactivity
                : t,
            )
          } else if (mutation.type === 'uncomplete') {
            tasks = tasks.map((t) =>
              t.id === mutation.taskId
                ? { ...t, isCompleted: false, completedAt: null }
                : t,
            )
          }
        }
      } else {
        error = result.error.message
      }

    } catch (cause) {
      error = getErrorMessage(cause)
    } finally {
      loading = false
    }
  },

  async createTask(input: CreateTaskRequest) {
    error = null
    const tempId = crypto.randomUUID()
    const optimistic = buildOptimisticTask(tempId, input)

    tasks = [optimistic, ...tasks]
    syncStatus.set(tempId, 'pending')

    const mutation: PendingMutation = {
      mutationId: nextMutationId(tempId),
      taskId: tempId,
      type: 'create',
      payload: input,
      createdAt: Date.now(),
      retryCount: 0,
    }
    addPendingMutation(mutation)

    await executeMutation(mutation)
  },

  async completeTask(id: string) {
    error = null
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    tasks = tasks.map((t) =>
      t.id === id
        ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } // eslint-disable-line svelte/prefer-svelte-reactivity
        : t,
    )
    syncStatus.set(id, 'pending')

    const mutation: PendingMutation = {
      mutationId: nextMutationId(id),
      taskId: id,
      type: 'complete',
      payload: { id, previousCompletedAt: task.completedAt },
      createdAt: Date.now(),
      retryCount: 0,
    }
    addPendingMutation(mutation)

    await executeMutation(mutation)
  },

  async uncompleteTask(id: string) {
    error = null
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    tasks = tasks.map((t) =>
      t.id === id
        ? { ...t, isCompleted: false, completedAt: null }
        : t,
    )
    syncStatus.set(id, 'pending')

    const mutation: PendingMutation = {
      mutationId: nextMutationId(id),
      taskId: id,
      type: 'uncomplete',
      payload: { id, previousCompletedAt: task.completedAt },
      createdAt: Date.now(),
      retryCount: 0,
    }
    addPendingMutation(mutation)

    await executeMutation(mutation)
  },

  retryMutation(taskId: string) {
    const mutation = getLatestMutationForTask(taskId)
    if (mutation) {
      clearRetryTimer(mutation.mutationId)
      executeMutation(mutation)
    }
  },
}
