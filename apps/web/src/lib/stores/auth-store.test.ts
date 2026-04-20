import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null })
const mockSignOut = vi.fn().mockResolvedValue({ error: null })
const mockRefreshSession = vi.fn().mockResolvedValue({
  data: { session: null },
  error: null,
})

let authChangeCallback: (event: string, session: unknown) => void

const mockOnAuthStateChange = vi.fn().mockImplementation((cb) => {
  authChangeCallback = cb
  return { data: { subscription: { unsubscribe: vi.fn() } } }
})

const mockSupabase = {
  auth: {
    signInWithOtp: mockSignInWithOtp,
    signOut: mockSignOut,
    refreshSession: mockRefreshSession,
    onAuthStateChange: mockOnAuthStateChange,
  },
}

vi.mock('$lib/supabase', () => ({
  getSupabase: () => mockSupabase,
}))

let authStore: typeof import('./auth-store.svelte').authStore

describe('authStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.mock('$lib/supabase', () => ({
      getSupabase: () => mockSupabase,
    }))
    ;({ authStore } = await import('./auth-store.svelte'))
  })

  it('starts with loading=true and null user/session', () => {
    expect(authStore.loading).toBe(true)
    expect(authStore.user).toBeNull()
    expect(authStore.session).toBeNull()
  })

  it('init() subscribes to onAuthStateChange', () => {
    authStore.init()
    expect(mockOnAuthStateChange).toHaveBeenCalledOnce()
  })

  it('updates state when auth state changes to SIGNED_IN', () => {
    authStore.init()

    const mockSession = {
      access_token: 'token-123',
      user: { id: 'user-1', email: 'test@example.com' },
    }
    authChangeCallback('SIGNED_IN', mockSession)

    expect(authStore.loading).toBe(false)
    expect(authStore.session).toEqual(mockSession)
    expect(authStore.user).toEqual(mockSession.user)
  })

  it('clears user/session on SIGNED_OUT', () => {
    authStore.init()

    const mockSession = {
      access_token: 'token-123',
      user: { id: 'user-1', email: 'test@example.com' },
    }
    authChangeCallback('SIGNED_IN', mockSession)
    authChangeCallback('SIGNED_OUT', null)

    expect(authStore.user).toBeNull()
    expect(authStore.session).toBeNull()
    expect(authStore.loading).toBe(false)
  })

  it('signIn() calls signInWithOtp with email and redirect', async () => {
    const { error } = await authStore.signIn('user@test.com')

    expect(error).toBeNull()
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'user@test.com',
      options: { emailRedirectTo: 'http://localhost:3000' },
    })
  })

  it('signOut() calls supabase signOut', async () => {
    authStore.init()
    authChangeCallback('SIGNED_IN', {
      access_token: 'token-123',
      user: { id: 'user-1', email: 'test@example.com' },
    })

    const { error } = await authStore.signOut()

    expect(error).toBeNull()
    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(authStore.session).toBeNull()
    expect(authStore.user).toBeNull()
  })

  it('refreshSession() updates session on success', async () => {
    const newSession = {
      access_token: 'new-token',
      user: { id: 'user-1', email: 'test@example.com' },
    }
    mockRefreshSession.mockResolvedValueOnce({
      data: { session: newSession },
      error: null,
    })

    const { error } = await authStore.refreshSession()

    expect(error).toBeNull()
    expect(authStore.session).toEqual(newSession)
    expect(authStore.user).toEqual(newSession.user)
  })

  it('refreshSession() clears state when no session is returned', async () => {
    authStore.init()
    authChangeCallback('SIGNED_IN', {
      access_token: 'token-123',
      user: { id: 'user-1', email: 'test@example.com' },
    })

    mockRefreshSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    })

    const result = await authStore.refreshSession()

    expect(result).toEqual({ session: null, error: null })
    expect(authStore.session).toBeNull()
    expect(authStore.user).toBeNull()
  })

  it('refreshSession() returns error when refresh fails', async () => {
    const authError = { message: 'Refresh failed', status: 400 }
    mockRefreshSession.mockResolvedValueOnce({
      data: { session: null },
      error: authError,
    })

    const { error } = await authStore.refreshSession()

    expect(error).toBe(authError)
  })
})
