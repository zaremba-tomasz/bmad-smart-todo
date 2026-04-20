import type { Task } from '@smart-todo/shared'
import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetSyncStatus = vi.fn()
const mockRetryMutation = vi.fn()
const mockHasPendingMutations = vi.fn()
const mockPendingMutations = vi.fn()

vi.mock('$lib/stores/task-store.svelte', () => ({
  taskStore: {
    getSyncStatus: (...args: unknown[]) => mockGetSyncStatus(...args),
    retryMutation: (...args: unknown[]) => mockRetryMutation(...args),
    get hasPendingMutations() { return mockHasPendingMutations() },
    get pendingMutations() { return mockPendingMutations() },
  },
}))

import TaskList from './TaskList.svelte'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Default Task',
    dueDate: null,
    dueTime: null,
    location: null,
    priority: null,
    groupId: null,
    isCompleted: false,
    completedAt: null,
    deletedAt: null,
    createdAt: '2026-04-18T10:00:00Z',
    ...overrides,
  }
}

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSyncStatus.mockReturnValue('synced')
    mockHasPendingMutations.mockReturnValue(false)
    mockPendingMutations.mockReturnValue([])
  })

  it('renders correct number of TaskItem components for given tasks', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Task A' }),
      makeTask({ id: 't2', title: 'Task B' }),
      makeTask({ id: 't3', title: 'Task C' }),
    ]
    render(TaskList, {
      props: {
        tasks,
        completedCount: 0,
        onComplete: vi.fn(),
        onUncomplete: vi.fn(),
      },
    })

    expect(screen.getByText('Task A')).toBeTruthy()
    expect(screen.getByText('Task B')).toBeTruthy()
    expect(screen.getByText('Task C')).toBeTruthy()

    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(3)
  })

  it('preserves task order from props (no client-side re-sorting)', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'First' }),
      makeTask({ id: 't2', title: 'Second' }),
      makeTask({ id: 't3', title: 'Third' }),
    ]
    render(TaskList, {
      props: {
        tasks,
        completedCount: 0,
        onComplete: vi.fn(),
        onUncomplete: vi.fn(),
      },
    })

    const items = screen.getAllByRole('listitem')
    expect(items[0].textContent).toContain('First')
    expect(items[1].textContent).toContain('Second')
    expect(items[2].textContent).toContain('Third')
  })

  it('completed count shown with correct number when > 0', () => {
    render(TaskList, {
      props: {
        tasks: [makeTask()],
        completedCount: 5,
        onComplete: vi.fn(),
        onUncomplete: vi.fn(),
      },
    })

    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText('completed')).toBeTruthy()
  })

  it('completed count hidden when count is 0', () => {
    render(TaskList, {
      props: {
        tasks: [makeTask()],
        completedCount: 0,
        onComplete: vi.fn(),
        onUncomplete: vi.fn(),
      },
    })

    expect(screen.queryByText('completed')).toBeNull()
  })

  it('uses <ul> semantic list markup', () => {
    render(TaskList, {
      props: {
        tasks: [makeTask()],
        completedCount: 0,
        onComplete: vi.fn(),
        onUncomplete: vi.fn(),
      },
    })

    const list = screen.getByRole('list', { name: 'Task list' })
    expect(list).toBeTruthy()
    expect(list.tagName).toBe('UL')
  })

  it('passes correct callbacks to TaskItem components', async () => {
    const onComplete = vi.fn()
    const onUncomplete = vi.fn()

    render(TaskList, {
      props: {
        tasks: [makeTask({ id: 'cb-test', title: 'Callback task' })],
        completedCount: 0,
        onComplete,
        onUncomplete,
      },
    })

    const checkbox = screen.getByRole('checkbox', { name: /Mark Callback task as complete/i })
    const { fireEvent } = await import('@testing-library/svelte')
    await fireEvent.click(checkbox)
    expect(onComplete).toHaveBeenCalledWith('cb-test')
  })
})
