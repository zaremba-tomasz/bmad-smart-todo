import { afterEach, describe, expect, it, vi } from 'vitest'

describe('createLLMProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('selects openrouter provider by default', async () => {
    vi.stubEnv('LLM_PROVIDER', undefined as unknown as string)
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubEnv('OPENROUTER_MODEL', 'test-model')

    const { createLLMProvider } = await import('./llm-provider.js')
    const provider = createLLMProvider()
    expect(provider).toBeDefined()
    expect(provider.extract).toBeTypeOf('function')
  })

  it('selects openrouter when LLM_PROVIDER=openrouter', async () => {
    vi.stubEnv('LLM_PROVIDER', 'openrouter')
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubEnv('OPENROUTER_MODEL', 'test-model')

    const { createLLMProvider } = await import('./llm-provider.js')
    const provider = createLLMProvider()
    expect(provider).toBeDefined()
    expect(provider.extract).toBeTypeOf('function')
  })

  it('selects lmstudio when LLM_PROVIDER=lmstudio', async () => {
    vi.stubEnv('LLM_PROVIDER', 'lmstudio')

    const { createLLMProvider } = await import('./llm-provider.js')
    const provider = createLLMProvider()
    expect(provider).toBeDefined()
    expect(provider.extract).toBeTypeOf('function')
  })

  it('throws for unknown provider', async () => {
    vi.stubEnv('LLM_PROVIDER', 'unknown-provider')

    const { createLLMProvider } = await import('./llm-provider.js')
    expect(() => createLLMProvider()).toThrow('Unknown LLM provider: unknown-provider')
  })
})
