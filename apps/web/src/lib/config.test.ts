import { beforeEach, describe, expect, it, vi } from 'vitest'

let loadConfig: typeof import('./config').loadConfig
let getConfig: typeof import('./config').getConfig

describe('config', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()

    ;({ loadConfig, getConfig } = await import('./config'))
  })

  it('returns empty config before loading', () => {
    expect(getConfig()).toEqual({})
  })

  it('loads config from /config.json', async () => {
    const mockConfig = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'test-key' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockConfig),
    }))

    await loadConfig()
    expect(getConfig()).toEqual(mockConfig)
  })

  it('handles fetch failure gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    await loadConfig()
    expect(getConfig()).toEqual({})
  })

  it('keeps config empty when /config.json returns a non-ok response', async () => {
    const json = vi.fn()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json,
    }))

    await loadConfig()

    expect(getConfig()).toEqual({})
    expect(json).not.toHaveBeenCalled()
  })
})
