import { describe, it, expect } from 'vitest'

import { TaskSchema, CreateTaskRequestSchema } from './task'

describe('TaskSchema', () => {
  it('validates a complete task', () => {
    const validTask = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Buy groceries',
      dueDate: '2026-04-20',
      dueTime: '14:30',
      location: 'Whole Foods',
      priority: 'medium' as const,
      groupId: null,
      isCompleted: false,
      completedAt: null,
      deletedAt: null,
      createdAt: '2026-04-17T10:00:00.000Z',
    }

    const result = TaskSchema.safeParse(validTask)
    expect(result.success).toBe(true)
  })

  it('rejects a task without title', () => {
    const invalidTask = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      title: '',
      dueDate: null,
      dueTime: null,
      location: null,
      priority: null,
      groupId: null,
      isCompleted: false,
      completedAt: null,
      deletedAt: null,
      createdAt: '2026-04-17T10:00:00.000Z',
    }

    const result = TaskSchema.safeParse(invalidTask)
    expect(result.success).toBe(false)
  })

  it('accepts nullable fields as null', () => {
    const task = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Minimal task',
      dueDate: null,
      dueTime: null,
      location: null,
      priority: null,
      groupId: null,
      isCompleted: false,
      completedAt: null,
      deletedAt: null,
      createdAt: '2026-04-17T10:00:00.000Z',
    }

    const result = TaskSchema.safeParse(task)
    expect(result.success).toBe(true)
  })
})

describe('CreateTaskRequestSchema', () => {
  it('validates a create task request', () => {
    const request = {
      title: 'New task',
      dueDate: null,
      dueTime: null,
      location: null,
      priority: 'high' as const,
      groupId: null,
    }

    const result = CreateTaskRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it('rejects non-null group ids until groups are implemented', () => {
    const request = {
      title: 'New task',
      dueDate: null,
      dueTime: null,
      location: null,
      priority: 'high' as const,
      groupId: '550e8400-e29b-41d4-a716-446655440999',
    }

    const result = CreateTaskRequestSchema.safeParse(request)
    expect(result.success).toBe(false)
  })
})
