import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import AppLayout from './AppLayout.svelte'

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  aud: 'authenticated',
  created_at: '2026-01-01',
  app_metadata: {},
  user_metadata: {},
}

describe('AppLayout', () => {
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

  it('renders capture placeholder on desktop and mobile', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    const placeholders = screen.getAllByText('Add a task…')
    expect(placeholders).toHaveLength(2)
    expect(placeholders.every((placeholder) => placeholder.closest('[aria-hidden="true"]'))).toBe(true)
  })

  it('renders task list placeholder text', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(screen.getByText('Tasks will appear here')).toBeTruthy()
  })

  it('displays user email', () => {
    render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(screen.getByText('test@example.com')).toBeTruthy()
  })

  it('uses the grid shell container', () => {
    const { container } = render(AppLayout, { props: { user: mockUser as any, onLogout: vi.fn() } })
    expect(container.querySelector('.app-shell')).toBeTruthy()
  })
})
