import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateClient = vi.fn().mockReturnValue({ auth: {} })

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

vi.mock('./config', () => ({
  getConfig: vi.fn(() => ({
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
  })),
}))

let getSupabase: typeof import('./supabase').getSupabase
let resetSupabaseClient: typeof import('./supabase').resetSupabaseClient

describe('supabase client', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.mock('@supabase/supabase-js', () => ({
      createClient: mockCreateClient,
    }))

    vi.mock('./config', () => ({
      getConfig: vi.fn(() => ({
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
      })),
    }))
    ;({ getSupabase, resetSupabaseClient } = await import('./supabase'))
  })

  it('creates client lazily on first call to getSupabase()', () => {
    expect(mockCreateClient).not.toHaveBeenCalled()

    getSupabase()

    expect(mockCreateClient).toHaveBeenCalledOnce()
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )
  })

  it('returns the same client instance on subsequent calls', () => {
    const first = getSupabase()
    const second = getSupabase()

    expect(first).toBe(second)
    expect(mockCreateClient).toHaveBeenCalledOnce()
  })

  it('creates a new client after resetSupabaseClient()', () => {
    getSupabase()
    expect(mockCreateClient).toHaveBeenCalledOnce()

    resetSupabaseClient()
    getSupabase()
    expect(mockCreateClient).toHaveBeenCalledTimes(2)
  })
})
