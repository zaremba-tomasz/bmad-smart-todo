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

import TaskItem from './TaskItem.svelte'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Buy groceries',
    dueDate: '2026-04-20',
    dueTime: null,
    location: 'Supermarket',
    priority: 'high',
    groupId: null,
    isCompleted: false,
    completedAt: null,
    deletedAt: null,
    createdAt: '2026-04-18T10:00:00Z',
    ...overrides,
  }
}

describe('TaskItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 20))
    mockGetSyncStatus.mockReturnValue('synced')
    mockHasPendingMutations.mockReturnValue(false)
    mockPendingMutations.mockReturnValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders task title in loud voice typography', () => {
    render(TaskItem, {
      props: { task: makeTask(), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    const title = screen.getByText('Buy groceries')
    expect(title).toBeTruthy()
    expect(title.className).toContain('text-text-primary')
  })

  it('renders due date in relative format (not ISO)', () => {
    render(TaskItem, {
      props: { task: makeTask(), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    expect(screen.getByText('Today')).toBeTruthy()
    expect(screen.queryByText('2026-04-20')).toBeNull()
  })

  it('renders priority badge with correct color classes for high priority', () => {
    render(TaskItem, {
      props: { task: makeTask({ priority: 'high' }), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    const badge = screen.getByText('High')
    expect(badge).toBeTruthy()
    expect(badge.className).toContain('bg-coral-100')
    expect(badge.className).toContain('text-coral-600')
  })

  it('renders priority badge with correct classes for urgent priority', () => {
    render(TaskItem, {
      props: { task: makeTask({ priority: 'urgent' }), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    const badge = screen.getByText('Urgent')
    expect(badge.className).toContain('bg-coral-500')
    expect(badge.className).toContain('text-white')
  })

  it('renders priority badge with correct classes for medium priority', () => {
    render(TaskItem, {
      props: { task: makeTask({ priority: 'medium' }), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    const badge = screen.getByText('Medium')
    expect(badge.className).toContain('bg-amber-100')
    expect(badge.className).toContain('text-amber-900')
  })

  it('renders priority badge with correct classes for low priority', () => {
    render(TaskItem, {
      props: { task: makeTask({ priority: 'low' }), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    const badge = screen.getByText('Low')
    expect(badge.className).toContain('bg-shimmer-base')
    expect(badge.className).toContain('text-text-secondary')
  })

  it('renders location when present', () => {
    render(TaskItem, {
      props: { task: makeTask({ location: 'Office' }), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    expect(screen.getByText('Office')).toBeTruthy()
  })

  it('hides location when null', () => {
    render(TaskItem, {
      props: { task: makeTask({ location: null }), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    expect(screen.queryByText('Supermarket')).toBeNull()
  })

  it('checkbox calls onComplete when open task is checked', async () => {
    const onComplete = vi.fn()
    render(TaskItem, {
      props: { task: makeTask(), onComplete, onUncomplete: vi.fn() },
    })

    const checkbox = screen.getByRole('checkbox', { name: /Mark Buy groceries as complete/i })
    await fireEvent.click(checkbox)

    expect(onComplete).toHaveBeenCalledWith('task-1')
  })

  it('checkbox calls onUncomplete when completed task is unchecked', async () => {
    const onUncomplete = vi.fn()
    render(TaskItem, {
      props: {
        task: makeTask({ isCompleted: true, completedAt: '2026-04-19T10:00:00Z' }),
        onComplete: vi.fn(),
        onUncomplete,
      },
    })

    const checkbox = screen.getByRole('checkbox', { name: /Mark Buy groceries as incomplete/i })
    await fireEvent.click(checkbox)

    expect(onUncomplete).toHaveBeenCalledWith('task-1')
  })

  it('completed task shows grayed text and completed surface tint', () => {
    const { container } = render(TaskItem, {
      props: {
        task: makeTask({ isCompleted: true, completedAt: '2026-04-19T10:00:00Z' }),
        onComplete: vi.fn(),
        onUncomplete: vi.fn(),
      },
    })

    const title = screen.getByText('Buy groceries')
    expect(title.className).toContain('text-text-tertiary')

    const taskItem = container.querySelector('.task-item')
    expect(taskItem?.className).toContain('bg-surface-completed')
  })

  it('SyncIndicator dot visible when syncStatus is pending', () => {
    mockGetSyncStatus.mockReturnValue('pending')
    render(TaskItem, {
      props: { task: makeTask(), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    expect(screen.getByRole('button', { name: 'Sync pending, tap to retry' })).toBeTruthy()
  })

  it('SyncIndicator dot hidden when syncStatus is synced', () => {
    mockGetSyncStatus.mockReturnValue('synced')
    render(TaskItem, {
      props: { task: makeTask(), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    expect(screen.queryByRole('button', { name: 'Sync pending, tap to retry' })).toBeNull()
  })

  it('checkbox touch area meets 44x44px minimum (check wrapper classes)', () => {
    const { container } = render(TaskItem, {
      props: { task: makeTask(), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    const checkboxWrapper = container.querySelector('.min-h-\\[44px\\].min-w-\\[44px\\]')
    expect(checkboxWrapper).toBeTruthy()
  })

  it('has ARIA attributes on checkbox (accessible name for task)', () => {
    render(TaskItem, {
      props: { task: makeTask(), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox.getAttribute('aria-label')).toBe('Mark Buy groceries as complete')
  })

  it('renders metadata dots between visible items', () => {
    const { container } = render(TaskItem, {
      props: { task: makeTask(), onComplete: vi.fn(), onUncomplete: vi.fn() },
    })

    const dots = container.querySelectorAll('[aria-hidden="true"]')
    const dotTexts = Array.from(dots).filter((el) => el.textContent === '·')
    expect(dotTexts.length).toBe(2) // date · priority · location
  })

  it('hides all metadata when no optional fields are present', () => {
    render(TaskItem, {
      props: {
        task: makeTask({ dueDate: null, priority: null, location: null }),
        onComplete: vi.fn(),
        onUncomplete: vi.fn(),
      },
    })

    expect(screen.getByText('Buy groceries')).toBeTruthy()
    expect(screen.queryByText('·')).toBeNull()
  })
})
