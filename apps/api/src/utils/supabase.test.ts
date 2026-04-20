import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateClient = vi.fn().mockReturnValue({ auth: {} })

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

let getSupabaseAdmin: typeof import('./supabase').getSupabaseAdmin
let createSupabaseClient: typeof import('./supabase').createSupabaseClient
let resetAdminClient: typeof import('./supabase').resetAdminClient

describe('supabase server utils', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.mock('@supabase/supabase-js', () => ({
      createClient: mockCreateClient,
    }))

    process.env.SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_ANON_KEY = 'anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    ;({ getSupabaseAdmin, createSupabaseClient, resetAdminClient } = await import('./supabase'))
  })

  describe('getSupabaseAdmin', () => {
    it('creates admin client with service role key', () => {
      getSupabaseAdmin()

      expect(mockCreateClient).toHaveBeenCalledWith(
        'http://localhost:54321',
        'service-role-key',
      )
    })

    it('returns cached admin client on subsequent calls', () => {
      const first = getSupabaseAdmin()
      const second = getSupabaseAdmin()

      expect(first).toBe(second)
      expect(mockCreateClient).toHaveBeenCalledOnce()
    })

    it('creates new client after reset', () => {
      getSupabaseAdmin()
      resetAdminClient()
      getSupabaseAdmin()

      expect(mockCreateClient).toHaveBeenCalledTimes(2)
    })
  })

  describe('createSupabaseClient', () => {
    it('creates per-request client with JWT in Authorization header', () => {
      createSupabaseClient('user-jwt-token')

      expect(mockCreateClient).toHaveBeenCalledWith(
        'http://localhost:54321',
        'anon-key',
        { global: { headers: { Authorization: 'Bearer user-jwt-token' } } },
      )
    })

    it('creates a new client for each call', () => {
      createSupabaseClient('token-1')
      createSupabaseClient('token-2')

      expect(mockCreateClient).toHaveBeenCalledTimes(2)
    })
  })
})
