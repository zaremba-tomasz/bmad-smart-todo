import type { Task, CreateTaskRequest } from '@smart-todo/shared'
import { TaskSchema, ApiSuccessSchema } from '@smart-todo/shared'
import { z } from 'zod'

import { api } from '$lib/api'

const TaskListResponseSchema = ApiSuccessSchema(z.array(TaskSchema))
const TaskResponseSchema = ApiSuccessSchema(TaskSchema)

let tasks = $state<Task[]>([])
let loading = $state(false)
let error = $state<string | null>(null)

function getErrorMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message
  return 'Request failed'
}

export const taskStore = {
  get tasks() { return tasks },
  get loading() { return loading },
  get error() { return error },
  get openTasks() { return tasks.filter((t) => !t.isCompleted) },
  get completedTasks() { return tasks.filter((t) => t.isCompleted) },
  get completedCount() { return tasks.filter((t) => t.isCompleted).length },

  async loadTasks() {
    loading = true
    error = null
    try {
      const result = await api.get('/api/tasks', TaskListResponseSchema)
      if (result.ok) {
        tasks = result.data.data
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
    try {
      const result = await api.post('/api/tasks', input, TaskResponseSchema)
      if (result.ok) {
        tasks = [result.data.data, ...tasks]
      } else {
        error = result.error.message
      }
    } catch (cause) {
      error = getErrorMessage(cause)
    }
  },

  async completeTask(id: string) {
    error = null
    try {
      const result = await api.post(`/api/tasks/${id}/complete`, {}, TaskResponseSchema)
      if (result.ok) {
        tasks = tasks.map((t) =>
          t.id === id ? result.data.data : t,
        )
      } else {
        error = result.error.message
      }
    } catch (cause) {
      error = getErrorMessage(cause)
    }
  },

  async uncompleteTask(id: string) {
    error = null
    try {
      const result = await api.post(`/api/tasks/${id}/uncomplete`, {}, TaskResponseSchema)
      if (result.ok) {
        tasks = tasks.map((t) =>
          t.id === id ? result.data.data : t,
        )
      } else {
        error = result.error.message
      }
    } catch (cause) {
      error = getErrorMessage(cause)
    }
  },
}
