import { describe, expect, it } from 'vitest'

import { camelToSnake, snakeToCamel } from './transform.js'

describe('snakeToCamel', () => {
  it('converts snake_case keys to camelCase', () => {
    const input = { user_id: '123', first_name: 'Alice' }
    expect(snakeToCamel(input)).toEqual({ userId: '123', firstName: 'Alice' })
  })

  it('preserves keys with no underscores', () => {
    const input = { id: '1', title: 'Test' }
    expect(snakeToCamel(input)).toEqual({ id: '1', title: 'Test' })
  })

  it('handles null values', () => {
    const input = { due_date: null, due_time: null }
    expect(snakeToCamel(input)).toEqual({ dueDate: null, dueTime: null })
  })

  it('handles undefined values', () => {
    const input = { due_date: undefined }
    expect(snakeToCamel(input)).toEqual({ dueDate: undefined })
  })

  it('handles nested objects', () => {
    const input = { user_profile: { first_name: 'Bob', last_name: 'Smith' } }
    expect(snakeToCamel(input)).toEqual({
      userProfile: { firstName: 'Bob', lastName: 'Smith' },
    })
  })

  it('handles arrays of objects', () => {
    const input = { task_list: [{ task_id: '1' }, { task_id: '2' }] }
    expect(snakeToCamel(input)).toEqual({
      taskList: [{ taskId: '1' }, { taskId: '2' }],
    })
  })

  it('handles empty object', () => {
    expect(snakeToCamel({})).toEqual({})
  })

  it('preserves non-object array elements', () => {
    const input = { tags: ['a', 'b', 'c'] }
    expect(snakeToCamel(input)).toEqual({ tags: ['a', 'b', 'c'] })
  })

  it('handles multiple consecutive underscores', () => {
    const input = { is_completed: true, completed_at: '2026-04-20T00:00:00Z' }
    expect(snakeToCamel(input)).toEqual({
      isCompleted: true,
      completedAt: '2026-04-20T00:00:00Z',
    })
  })
})

describe('camelToSnake', () => {
  it('converts camelCase keys to snake_case', () => {
    const input = { userId: '123', firstName: 'Alice' }
    expect(camelToSnake(input)).toEqual({ user_id: '123', first_name: 'Alice' })
  })

  it('preserves keys with no uppercase', () => {
    const input = { id: '1', title: 'Test' }
    expect(camelToSnake(input)).toEqual({ id: '1', title: 'Test' })
  })

  it('handles null values', () => {
    const input = { dueDate: null, dueTime: null }
    expect(camelToSnake(input)).toEqual({ due_date: null, due_time: null })
  })

  it('handles undefined values', () => {
    const input = { dueDate: undefined }
    expect(camelToSnake(input)).toEqual({ due_date: undefined })
  })

  it('handles nested objects', () => {
    const input = { userProfile: { firstName: 'Bob', lastName: 'Smith' } }
    expect(camelToSnake(input)).toEqual({
      user_profile: { first_name: 'Bob', last_name: 'Smith' },
    })
  })

  it('handles arrays of objects', () => {
    const input = { taskList: [{ taskId: '1' }, { taskId: '2' }] }
    expect(camelToSnake(input)).toEqual({
      task_list: [{ task_id: '1' }, { task_id: '2' }],
    })
  })

  it('handles empty object', () => {
    expect(camelToSnake({})).toEqual({})
  })

  it('preserves non-object array elements', () => {
    const input = { tags: ['a', 'b', 'c'] }
    expect(camelToSnake(input)).toEqual({ tags: ['a', 'b', 'c'] })
  })

  it('handles boolean and number values', () => {
    const input = { isCompleted: true, completedAt: null, taskCount: 5 }
    expect(camelToSnake(input)).toEqual({
      is_completed: true,
      completed_at: null,
      task_count: 5,
    })
  })
})
