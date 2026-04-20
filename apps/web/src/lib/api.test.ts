import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const mockAuthStore = {
  session: null as { access_token: string } | null,
  refreshSession: vi.fn(),
  signOut: vi.fn(),
}

vi.mock('$lib/stores/auth-store.svelte', () => ({
  authStore: mockAuthStore,
}))

let api: typeof import('./api').api

describe('api client', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.unstubAllGlobals()

    vi.mock('$lib/stores/auth-store.svelte', () => ({
      authStore: mockAuthStore,
    }))

    mockAuthStore.session = { access_token: 'test-jwt' }
    mockAuthStore.refreshSession.mockResolvedValue({
      session: mockAuthStore.session,
      error: null,
    })
    mockAuthStore.signOut.mockResolvedValue({ error: null })
    ;({ api } = await import('./api'))
  })

  it('includes Authorization header when session exists', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'ok' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await api.get('/api/tasks')

    expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer test-jwt',
      }),
    }))
  })

  it('omits Authorization header when no session', async () => {
    mockAuthStore.session = null

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'ok' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await api.get('/api/tasks')

    const calledHeaders = mockFetch.mock.calls[0][1].headers
    expect(calledHeaders).not.toHaveProperty('Authorization')
  })

  it('returns parsed data on successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [1, 2, 3] }),
    }))

    const result = await api.get('/api/tasks')

    expect(result).toEqual({ ok: true, data: { items: [1, 2, 3] } })
  })

  it('validates response with Zod schema when provided', async () => {
    const schema = z.object({ count: z.number() })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ count: 42 }),
    }))

    const result = await api.get('/api/count', schema)

    expect(result).toEqual({ ok: true, data: { count: 42 } })
  })

  it('returns error on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }),
    }))

    const result = await api.get('/api/tasks')

    expect(result).toEqual({
      ok: false,
      error: { code: 'SERVER_ERROR', message: 'Internal error' },
    })
  })

  it('retries once on 401 after successful token refresh', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'refreshed' }),
      })
    vi.stubGlobal('fetch', mockFetch)

    mockAuthStore.refreshSession.mockResolvedValue({
      session: { access_token: 'new-jwt' },
      error: null,
    })
    mockAuthStore.session = { access_token: 'old-jwt' }

    const result = await api.get('/api/tasks')

    expect(mockAuthStore.refreshSession).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/tasks',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer new-jwt',
        }),
      }),
    )
    expect(result).toEqual({ ok: true, data: { data: 'refreshed' } })
  })

  it('signs out and returns error when refresh fails on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    }))

    mockAuthStore.refreshSession.mockResolvedValue({ error: { message: 'Token expired' } })

    const result = await api.get('/api/tasks')

    expect(mockAuthStore.signOut).toHaveBeenCalledOnce()
    expect(result).toEqual({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Session expired' },
    })
  })

  it('signs out when refresh succeeds without a session', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    mockAuthStore.refreshSession.mockResolvedValue({
      session: null,
      error: null,
    })

    const result = await api.get('/api/tasks')

    expect(mockAuthStore.signOut).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(result).toEqual({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Session expired' },
    })
  })

  it('post() sends JSON body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '123' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await api.post('/api/tasks', { title: 'New task' })

    expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ title: 'New task' }),
    }))
  })

  it('handles non-JSON error responses gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error('not JSON')),
    }))

    const result = await api.get('/api/tasks')

    expect(result).toEqual({
      ok: false,
      error: { code: 'SERVER_ERROR', message: 'Request failed with status 502' },
    })
  })
})
