import type { Task } from '@smart-todo/shared'
import { render, screen, fireEvent } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
    vi.useFakeTimers()
    mockGetSyncStatus.mockReturnValue('synced')
    mockHasPendingMutations.mockReturnValue(false)
    mockPendingMutations.mockReturnValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
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
    await fireEvent.click(checkbox)
    expect(onComplete).toHaveBeenCalledWith('cb-test')
  })

  it('ARIA live region element exists in DOM with role="status" and is visually hidden', () => {
    render(TaskList, {
      props: {
        tasks: [makeTask()],
        completedCount: 0,
        onComplete: vi.fn(),
        onUncomplete: vi.fn(),
      },
    })

    const liveRegion = screen.getByRole('status')
    expect(liveRegion).toBeTruthy()
    expect(liveRegion.className).toContain('sr-only')
    expect(liveRegion.getAttribute('aria-live')).toBe('polite')
  })

  it('completing a task sets announcement text containing "Task completed" and the count', async () => {
    const onComplete = vi.fn()
    render(TaskList, {
      props: {
        tasks: [makeTask({ id: 'announce-1', title: 'Announce task' })],
        completedCount: 2,
        onComplete,
        onUncomplete: vi.fn(),
      },
    })

    const checkbox = screen.getByRole('checkbox', { name: /Mark Announce task as complete/i })
    await fireEvent.click(checkbox)

    const liveRegion = screen.getByRole('status')
    expect(liveRegion.textContent).toContain('Task completed')
    expect(liveRegion.textContent).toContain('3')
  })

  it('uncompleting a task sets announcement text containing "Task reopened" and the count', async () => {
    const onUncomplete = vi.fn()
    render(TaskList, {
      props: {
        tasks: [makeTask({ id: 'reopen-1', title: 'Reopen task', isCompleted: true, completedAt: '2026-04-19T10:00:00Z' })],
        completedCount: 3,
        onComplete: vi.fn(),
        onUncomplete,
      },
    })

    const checkbox = screen.getByRole('checkbox', { name: /Mark Reopen task as incomplete/i })
    await fireEvent.click(checkbox)

    const liveRegion = screen.getByRole('status')
    expect(liveRegion.textContent).toContain('Task reopened')
    expect(liveRegion.textContent).toContain('2')
  })

  it('announcement text clears after ~1 second', async () => {
    render(TaskList, {
      props: {
        tasks: [makeTask({ id: 'clear-1', title: 'Clear task' })],
        completedCount: 0,
        onComplete: vi.fn(),
        onUncomplete: vi.fn(),
      },
    })

    const checkbox = screen.getByRole('checkbox', { name: /Mark Clear task as complete/i })
    await fireEvent.click(checkbox)

    const liveRegion = screen.getByRole('status')
    expect(liveRegion.textContent).toContain('Task completed')

    await vi.advanceTimersByTimeAsync(1000)
    expect(liveRegion.textContent?.trim()).toBe('')
  })

  it('rapid completions announce incrementing counts without waiting for prop updates', async () => {
    render(TaskList, {
      props: {
        tasks: [
          makeTask({ id: 'rapid-1', title: 'Rapid one' }),
          makeTask({ id: 'rapid-2', title: 'Rapid two' }),
        ],
        completedCount: 0,
        onComplete: vi.fn(),
        onUncomplete: vi.fn(),
      },
    })

    const firstCheckbox = screen.getByRole('checkbox', { name: /Mark Rapid one as complete/i })
    const secondCheckbox = screen.getByRole('checkbox', { name: /Mark Rapid two as complete/i })
    await fireEvent.click(firstCheckbox)
    await fireEvent.click(secondCheckbox)

    const liveRegion = screen.getByRole('status')
    expect(liveRegion.textContent).toContain('Task completed')
    expect(liveRegion.textContent).toContain('2')
  })

  it('clears pending announcement timeout on unmount', async () => {
    const { unmount } = render(TaskList, {
      props: {
        tasks: [makeTask({ id: 'teardown-1', title: 'Teardown task' })],
        completedCount: 0,
        onComplete: vi.fn(),
        onUncomplete: vi.fn(),
      },
    })

    const checkbox = screen.getByRole('checkbox', { name: /Mark Teardown task as complete/i })
    await fireEvent.click(checkbox)

    const timerCountBeforeUnmount = vi.getTimerCount()
    expect(timerCountBeforeUnmount).toBeGreaterThan(0)

    unmount()

    expect(vi.getTimerCount()).toBeLessThan(timerCountBeforeUnmount)
  })
})
