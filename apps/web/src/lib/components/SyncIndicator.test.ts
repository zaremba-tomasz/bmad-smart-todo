import { render, screen, fireEvent } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

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

import SyncIndicator from './SyncIndicator.svelte'

describe('SyncIndicator', () => {
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

  describe('sync dot (mode="dot")', () => {
    it('is visible when task sync status is pending', () => {
      mockGetSyncStatus.mockReturnValue('pending')
      render(SyncIndicator, { props: { taskId: 'task-1', mode: 'dot' } })

      const dot = screen.getByRole('button', { name: 'Sync pending, tap to retry' })
      expect(dot).toBeTruthy()
    })

    it('is hidden when task sync status is synced', () => {
      mockGetSyncStatus.mockReturnValue('synced')
      render(SyncIndicator, { props: { taskId: 'task-1', mode: 'dot' } })

      expect(screen.queryByRole('button', { name: 'Sync pending, tap to retry' })).toBeNull()
    })

    it('calls taskStore.retryMutation when clicked', async () => {
      mockGetSyncStatus.mockReturnValue('pending')
      render(SyncIndicator, { props: { taskId: 'task-1', mode: 'dot' } })

      const dot = screen.getByRole('button', { name: 'Sync pending, tap to retry' })
      await fireEvent.click(dot)

      expect(mockRetryMutation).toHaveBeenCalledWith('task-1')
    })

    it('has correct aria-label attribute', () => {
      mockGetSyncStatus.mockReturnValue('pending')
      render(SyncIndicator, { props: { taskId: 'task-1', mode: 'dot' } })

      const dot = screen.getByRole('button', { name: 'Sync pending, tap to retry' })
      expect(dot.getAttribute('aria-label')).toBe('Sync pending, tap to retry')
    })
  })

  describe('global banner (mode="banner")', () => {
    it('is visible after 60s of unsynced state', () => {
      const staleCreatedAt = Date.now() - 61_000
      mockHasPendingMutations.mockReturnValue(true)
      mockPendingMutations.mockReturnValue([
        { id: 'task-1', type: 'create', payload: {}, createdAt: staleCreatedAt, retryCount: 0 },
      ])

      render(SyncIndicator, { props: { mode: 'banner' } })

      expect(screen.getByText("Some tasks haven't synced yet")).toBeTruthy()
    })

    it('is not visible when mutations are fresh (under 60s)', () => {
      const freshCreatedAt = Date.now() - 30_000
      mockHasPendingMutations.mockReturnValue(true)
      mockPendingMutations.mockReturnValue([
        { id: 'task-1', type: 'create', payload: {}, createdAt: freshCreatedAt, retryCount: 0 },
      ])

      render(SyncIndicator, { props: { mode: 'banner' } })

      expect(screen.queryByText("Some tasks haven't synced yet")).toBeNull()
    })

    it('is dismissible via close button', async () => {
      const staleCreatedAt = Date.now() - 61_000
      mockHasPendingMutations.mockReturnValue(true)
      mockPendingMutations.mockReturnValue([
        { id: 'task-1', type: 'create', payload: {}, createdAt: staleCreatedAt, retryCount: 0 },
      ])

      render(SyncIndicator, { props: { mode: 'banner' } })
      expect(screen.getByText("Some tasks haven't synced yet")).toBeTruthy()

      const dismissBtn = screen.getByRole('button', { name: 'Dismiss sync notification' })
      await fireEvent.click(dismissBtn)

      expect(screen.queryByText("Some tasks haven't synced yet")).toBeNull()
    })

    it('auto-clears when all tasks sync', () => {
      const staleCreatedAt = Date.now() - 61_000
      mockHasPendingMutations.mockReturnValue(true)
      mockPendingMutations.mockReturnValue([
        { id: 'task-1', type: 'create', payload: {}, createdAt: staleCreatedAt, retryCount: 0 },
      ])

      const { rerender } = render(SyncIndicator, { props: { mode: 'banner' } })
      expect(screen.getByText("Some tasks haven't synced yet")).toBeTruthy()

      mockHasPendingMutations.mockReturnValue(false)
      mockPendingMutations.mockReturnValue([])

      rerender({ mode: 'banner' })

      expect(screen.queryByText("Some tasks haven't synced yet")).toBeNull()
    })

    it('has role="status" attribute', () => {
      const staleCreatedAt = Date.now() - 61_000
      mockHasPendingMutations.mockReturnValue(true)
      mockPendingMutations.mockReturnValue([
        { id: 'task-1', type: 'create', payload: {}, createdAt: staleCreatedAt, retryCount: 0 },
      ])

      render(SyncIndicator, { props: { mode: 'banner' } })

      const banner = screen.getByRole('status')
      expect(banner).toBeTruthy()
    })

    it('has aria-live="polite" attribute', () => {
      const staleCreatedAt = Date.now() - 61_000
      mockHasPendingMutations.mockReturnValue(true)
      mockPendingMutations.mockReturnValue([
        { id: 'task-1', type: 'create', payload: {}, createdAt: staleCreatedAt, retryCount: 0 },
      ])

      render(SyncIndicator, { props: { mode: 'banner' } })

      const banner = screen.getByRole('status')
      expect(banner.getAttribute('aria-live')).toBe('polite')
    })
  })
})
