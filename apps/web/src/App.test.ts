import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let mockUser: { id: string; email: string } | null = null
let mockLoading = false

vi.mock('$lib/stores/auth-store.svelte', () => ({
  authStore: {
    get user() { return mockUser },
    get session() { return mockUser ? { access_token: 'tok' } : null },
    get loading() { return mockLoading },
    init: vi.fn(),
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    refreshSession: vi.fn().mockResolvedValue({ session: null, error: null }),
  },
}))

vi.mock('$lib/auth-errors', () => ({
  getLoginErrorMessage: (msg: string) => msg,
}))

describe('App', () => {
  beforeEach(() => {
    mockUser = null
    mockLoading = false
  })

  it('renders login form when unauthenticated', async () => {
    const App = (await import('./App.svelte')).default
    render(App)

    expect(screen.getByLabelText('Email address')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Send magic link' })).toBeTruthy()
  })

  it('renders loading state', async () => {
    mockLoading = true
    const App = (await import('./App.svelte')).default
    render(App)

    expect(screen.getByText('Loading…')).toBeTruthy()
  })

  it('renders AppLayout when authenticated', async () => {
    mockUser = { id: 'user-1', email: 'test@example.com' }
    const App = (await import('./App.svelte')).default
    render(App)

    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByRole('main')).toBeTruthy()
    expect(screen.getByText('Smart Todo')).toBeTruthy()
  })
})
