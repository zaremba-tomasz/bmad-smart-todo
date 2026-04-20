import {
  ApiSuccessSchema,
  CreateTaskRequestSchema,
  ErrorCode,
  TaskSchema,
} from '@smart-todo/shared'
import type { Task } from '@smart-todo/shared'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { camelToSnake, snakeToCamel } from '../utils/transform.js'

const PRIORITY_WEIGHT: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}
const IdParamsSchema = z.object({ id: z.string().uuid() })
const TaskResponseSchema = ApiSuccessSchema(TaskSchema)
const TaskListResponseSchema = ApiSuccessSchema(z.array(TaskSchema))

function sortTasks(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    const wa = a.priority ? PRIORITY_WEIGHT[a.priority] ?? 0 : 0
    const wb = b.priority ? PRIORITY_WEIGHT[b.priority] ?? 0 : 0
    if (wb !== wa) return wb - wa
    if (a.dueDate && !b.dueDate) return -1
    if (!a.dueDate && b.dueDate) return 1
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    return 0
  })
}

function parseTaskRow(row: Record<string, unknown>): Task | null {
  const taskResult = TaskSchema.safeParse(snakeToCamel<Task>(row))
  if (!taskResult.success) return null
  return taskResult.data
}

export async function taskRoutes(fastify: FastifyInstance) {
  fastify.post('/api/tasks', async (request, reply) => {
    const parsed = CreateTaskRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: ErrorCode.enum.VALIDATION_ERROR,
          message: parsed.error.issues[0]?.message ?? 'Invalid request body',
        },
      })
    }

    const snakeBody = camelToSnake(parsed.data as unknown as Record<string, unknown>)
    const insertData = { ...snakeBody, user_id: request.userId }

    const { data, error } = await request.supabaseClient
      .from('tasks')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return reply.status(500).send({
        error: { code: ErrorCode.enum.SERVER_ERROR, message: error.message },
      })
    }

    const task = parseTaskRow(data as Record<string, unknown>)
    if (!task) {
      return reply.status(500).send({
        error: {
          code: ErrorCode.enum.SERVER_ERROR,
          message: 'Invalid task payload returned from database',
        },
      })
    }

    const responseResult = TaskResponseSchema.safeParse({ data: task })
    if (!responseResult.success) {
      return reply.status(500).send({
        error: {
          code: ErrorCode.enum.SERVER_ERROR,
          message: 'Failed to serialize task response',
        },
      })
    }

    return reply.status(201).send(responseResult.data)
  })

  fastify.get('/api/tasks', async (request, reply) => {
    const { data, error } = await request.supabaseClient
      .from('tasks')
      .select('*')
      .is('deleted_at', null)

    if (error) {
      return reply.status(500).send({
        error: { code: ErrorCode.enum.SERVER_ERROR, message: error.message },
      })
    }

    const tasks: Task[] = []
    for (const row of data as Record<string, unknown>[]) {
      const task = parseTaskRow(row)
      if (!task) {
        return reply.status(500).send({
          error: {
            code: ErrorCode.enum.SERVER_ERROR,
            message: 'Invalid task payload returned from database',
          },
        })
      }
      tasks.push(task)
    }

    const sorted = sortTasks(tasks)
    const responseResult = TaskListResponseSchema.safeParse({ data: sorted })
    if (!responseResult.success) {
      return reply.status(500).send({
        error: {
          code: ErrorCode.enum.SERVER_ERROR,
          message: 'Failed to serialize task list response',
        },
      })
    }

    return reply.send(responseResult.data)
  })

  fastify.post<{ Params: { id: string } }>('/api/tasks/:id/complete', async (request, reply) => {
    const paramsResult = IdParamsSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return reply.status(400).send({
        error: {
          code: ErrorCode.enum.VALIDATION_ERROR,
          message: paramsResult.error.issues[0]?.message ?? 'Invalid task id',
        },
      })
    }

    const { id } = paramsResult.data

    const { data, error } = await request.supabaseClient
      .from('tasks')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return reply.status(404).send({
          error: { code: ErrorCode.enum.NOT_FOUND, message: 'Task not found' },
        })
      }
      return reply.status(500).send({
        error: { code: ErrorCode.enum.SERVER_ERROR, message: error.message },
      })
    }

    const task = parseTaskRow(data as Record<string, unknown>)
    if (!task) {
      return reply.status(500).send({
        error: {
          code: ErrorCode.enum.SERVER_ERROR,
          message: 'Invalid task payload returned from database',
        },
      })
    }

    const responseResult = TaskResponseSchema.safeParse({ data: task })
    if (!responseResult.success) {
      return reply.status(500).send({
        error: {
          code: ErrorCode.enum.SERVER_ERROR,
          message: 'Failed to serialize task response',
        },
      })
    }

    return reply.send(responseResult.data)
  })

  fastify.post<{ Params: { id: string } }>('/api/tasks/:id/uncomplete', async (request, reply) => {
    const paramsResult = IdParamsSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return reply.status(400).send({
        error: {
          code: ErrorCode.enum.VALIDATION_ERROR,
          message: paramsResult.error.issues[0]?.message ?? 'Invalid task id',
        },
      })
    }

    const { id } = paramsResult.data

    const { data, error } = await request.supabaseClient
      .from('tasks')
      .update({ is_completed: false, completed_at: null })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return reply.status(404).send({
          error: { code: ErrorCode.enum.NOT_FOUND, message: 'Task not found' },
        })
      }
      return reply.status(500).send({
        error: { code: ErrorCode.enum.SERVER_ERROR, message: error.message },
      })
    }

    const task = parseTaskRow(data as Record<string, unknown>)
    if (!task) {
      return reply.status(500).send({
        error: {
          code: ErrorCode.enum.SERVER_ERROR,
          message: 'Invalid task payload returned from database',
        },
      })
    }

    const responseResult = TaskResponseSchema.safeParse({ data: task })
    if (!responseResult.success) {
      return reply.status(500).send({
        error: {
          code: ErrorCode.enum.SERVER_ERROR,
          message: 'Failed to serialize task response',
        },
      })
    }

    return reply.send(responseResult.data)
  })
}
