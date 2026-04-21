import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockLoadTasks = vi.fn()
const mockTasks = vi.fn()
const mockOpenTasks = vi.fn()
const mockCompletedCount = vi.fn()
const mockLoading = vi.fn()
const mockError = vi.fn()
const mockCompleteTask = vi.fn()
const mockUncompleteTask = vi.fn()
const mockGetSyncStatus = vi.fn()
const mockRetryMutation = vi.fn()
const mockHasPendingMutations = vi.fn()
const mockPendingMutations = vi.fn()

vi.mock('$lib/stores/task-store.svelte', () => ({
  taskStore: {
    loadTasks: (...args: unknown[]) => mockLoadTasks(...args),
    completeTask: (...args: unknown[]) => mockCompleteTask(...args),
    uncompleteTask: (...args: unknown[]) => mockUncompleteTask(...args),
    getSyncStatus: (...args: unknown[]) => mockGetSyncStatus(...args),
    retryMutation: (...args: unknown[]) => mockRetryMutation(...args),
    get tasks() { return mockTasks() },
    get openTasks() { return mockOpenTasks() },
    get completedCount() { return mockCompletedCount() },
    get loading() { return mockLoading() },
    get error() { return mockError() },
    get hasPendingMutations() { return mockHasPendingMutations() },
    get pendingMutations() { return mockPendingMutations() },
  },
}))

vi.mock('$lib/stores/capture-store.svelte', () => ({
  captureStore: {
    submitForExtraction: vi.fn(),
    setRawInput: vi.fn(),
    resetCapture: vi.fn(),
    get state() { return 'idle' },
    get rawInput() { return '' },
    get extractedFields() { return null },
  },
}))

import AppLayout from './AppLayout.svelte'

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  aud: 'authenticated',
  created_at: '2026-01-01',
  app_metadata: {},
  user_metadata: {},
}

function setupDefaults() {
  mockTasks.mockReturnValue([])
  mockOpenTasks.mockReturnValue([])
  mockCompletedCount.mockReturnValue(0)
  mockLoading.mockReturnValue(false)
  mockError.mockReturnValue(null)
  mockGetSyncStatus.mockReturnValue('synced')
  mockHasPendingMutations.mockReturnValue(false)
  mockPendingMutations.mockReturnValue([])
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaults()
  })

  it('renders header with banner role', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(screen.getByRole('banner')).toBeTruthy()
  })

  it('renders app title in header', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(screen.getByText('Smart Todo')).toBeTruthy()
  })

  it('renders main landmark with id task-list', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    const main = screen.getByRole('main')
    expect(main).toBeTruthy()
    expect(main.id).toBe('task-list')
    expect(main.getAttribute('tabindex')).toBe('-1')
    expect(main.className).toContain('overflow-y-auto')
  })

  it('renders skip link with focus-visible styling targeting #task-list', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    const skipLink = screen.getByText('Skip to task list')
    expect(skipLink).toBeTruthy()
    expect(skipLink.tagName).toBe('A')
    expect(skipLink.getAttribute('href')).toBe('#task-list')
    expect(skipLink.className).toContain('focus-visible:ring-2')
    expect(skipLink.className).toContain('focus-visible:not-sr-only')
  })

  it('renders nav landmark with Group filters aria-label', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    const nav = screen.getByRole('navigation')
    expect(nav).toBeTruthy()
    expect(nav.getAttribute('aria-label')).toBe('Group filters')
  })

  it('renders logout button that calls onLogout callback', async () => {
    const onLogout = vi.fn()
    render(AppLayout, { props: { user: mockUser as any, onLogout } })

    const button = screen.getByRole('button', { name: 'Sign out' })
    expect(button).toBeTruthy()

    await fireEvent.click(button)
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('renders CaptureInput in the layout', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    const inputs = screen.getAllByLabelText('Add a task')
    expect(inputs.length).toBeGreaterThanOrEqual(1)
    expect(inputs[0].tagName).toBe('INPUT')
  })

  it('renders submit task button in the layout', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    const buttons = screen.getAllByLabelText('Submit task')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders unique capture input description ids for both instances', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    const descriptions = Array.from(document.querySelectorAll('[id^="capture-input-description-"]'))
    expect(descriptions.length).toBe(2)
    expect(new Set(descriptions.map((element) => element.id)).size).toBe(descriptions.length)
  })

  it('displays user email', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(screen.getByText('test@example.com')).toBeTruthy()
  })

  it('uses the grid shell container', () => {
    const { container } = render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(container.querySelector('.app-shell')).toBeTruthy()
  })

  it('calls taskStore.loadTasks on mount', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(mockLoadTasks).toHaveBeenCalled()
  })

  it('shows EmptyState when no tasks exist and not loading', () => {
    mockTasks.mockReturnValue([])
    mockLoading.mockReturnValue(false)

    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(screen.getByText('Your task list is clear.')).toBeTruthy()
  })

  it('shows loading text while taskStore is loading', () => {
    mockLoading.mockReturnValue(true)

    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(screen.getByText('Loading…')).toBeTruthy()
  })

  it('shows error state and retry button when task load fails', async () => {
    mockError.mockReturnValue('boom')

    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(screen.getByText("Couldn't load tasks. Please try again.")).toBeTruthy()

    const retryButton = screen.getByRole('button', { name: 'Retry' })
    await fireEvent.click(retryButton)

    expect(mockLoadTasks).toHaveBeenCalledTimes(2)
  })

  it('shows TaskList when tasks exist', () => {
    mockTasks.mockReturnValue([
      {
        id: 't1',
        userId: 'u1',
        title: 'Test Task',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
        isCompleted: false,
        completedAt: null,
        deletedAt: null,
        createdAt: '2026-04-18T10:00:00Z',
      },
    ])
    mockCompletedCount.mockReturnValue(0)
    mockLoading.mockReturnValue(false)

    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(screen.getByText('Test Task')).toBeTruthy()
    expect(screen.getByRole('list', { name: 'Task list' })).toBeTruthy()
  })

  it('shows TaskList with completed count when only completed tasks exist', () => {
    mockTasks.mockReturnValue([
      {
        id: 't1',
        userId: 'u1',
        title: 'Done Task',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
        isCompleted: true,
        completedAt: '2026-04-19T10:00:00Z',
        deletedAt: null,
        createdAt: '2026-04-18T10:00:00Z',
      },
    ])
    mockCompletedCount.mockReturnValue(1)
    mockLoading.mockReturnValue(false)

    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(screen.queryByText('Your task list is clear.')).toBeNull()
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('completed')).toBeTruthy()
  })
})
