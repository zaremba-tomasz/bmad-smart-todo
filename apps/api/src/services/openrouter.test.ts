import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EXTRACTION_SYSTEM_PROMPT } from './llm-provider.js'

const VALID_EXTRACTION = {
  title: 'Call the dentist',
  dueDate: '2026-04-27',
  dueTime: null,
  location: null,
  priority: 'high',
  recurrence: null,
}

function makeResponse(content: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
  }
}

describe('OpenRouter provider', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key')
    vi.stubEnv('OPENROUTER_MODEL', 'meta-llama/llama-3.1-70b-instruct')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns parsed extraction result on success', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createOpenRouterProvider } = await import('./openrouter.js')
    const provider = createOpenRouterProvider()
    const result = await provider.extract('Call the dentist next Monday, high priority')

    expect(result).toEqual(VALID_EXTRACTION)
  })

  it('sends correct request shape with structured output', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createOpenRouterProvider } = await import('./openrouter.js')
    const provider = createOpenRouterProvider()
    await provider.extract('Call the dentist')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]

    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.model).toBe('meta-llama/llama-3.1-70b-instruct')
    expect(body.response_format.type).toBe('json_schema')
    expect(body.response_format.json_schema.name).toBe('extraction_result')
    expect(body.response_format.json_schema.strict).toBe(true)
  })

  it('sends only raw text in user message (FR38 privacy)', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createOpenRouterProvider } = await import('./openrouter.js')
    const provider = createOpenRouterProvider()
    await provider.extract('Buy groceries')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    const messages = body.messages

    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toBe(EXTRACTION_SYSTEM_PROMPT)
    expect(messages[1].role).toBe('user')
    expect(messages[1].content).toBe('Buy groceries')
  })

  it('includes no-training provider filtering (FR39)', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createOpenRouterProvider } = await import('./openrouter.js')
    const provider = createOpenRouterProvider()
    await provider.extract('test')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.provider.data_collection).toBe('deny')
    expect(body.provider.require_parameters).toBe(true)
  })

  it('includes correct headers', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createOpenRouterProvider } = await import('./openrouter.js')
    const provider = createOpenRouterProvider()
    await provider.extract('test')

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['Authorization']).toBe('Bearer test-api-key')
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['HTTP-Referer']).toBe('https://smart-todo.app')
    expect(headers['X-Title']).toBe('Smart Todo')
  })

  it('passes AbortController signal to fetch', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createOpenRouterProvider } = await import('./openrouter.js')
    const provider = createOpenRouterProvider()
    await provider.extract('test')

    const options = mockFetch.mock.calls[0][1]
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })

  it('throws ExtractionTimeoutError on timeout', async () => {
    mockFetch.mockImplementationOnce(() => {
      const error = new DOMException('The operation was aborted', 'AbortError')
      return Promise.reject(error)
    })

    const { createOpenRouterProvider } = await import('./openrouter.js')
    const provider = createOpenRouterProvider()

    await expect(provider.extract('test')).rejects.toThrow('LLM extraction timed out')
  })

  it('treats non-DOMException AbortError as timeout', async () => {
    mockFetch.mockRejectedValueOnce({ name: 'AbortError' })

    const { createOpenRouterProvider } = await import('./openrouter.js')
    const provider = createOpenRouterProvider()

    await expect(provider.extract('test')).rejects.toThrow('LLM extraction timed out')
  })

  it('throws ExtractionProviderError on non-200 response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    const { createOpenRouterProvider } = await import('./openrouter.js')
    const provider = createOpenRouterProvider()

    await expect(provider.extract('test')).rejects.toThrow('Provider returned 500')
  })

  it('throws ExtractionProviderError when response has no content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: {} }] }),
    })

    const { createOpenRouterProvider } = await import('./openrouter.js')
    const provider = createOpenRouterProvider()

    await expect(provider.extract('test')).rejects.toThrow('No content in provider response')
  })

  it('throws ExtractionProviderError on malformed JSON content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'not valid json' } }],
      }),
    })

    const { createOpenRouterProvider } = await import('./openrouter.js')
    const provider = createOpenRouterProvider()

    await expect(provider.extract('test')).rejects.toThrow()
  })

  it('throws ExtractionProviderError when OPENROUTER_API_KEY is missing', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', undefined as unknown as string)
    delete process.env.OPENROUTER_API_KEY

    const { createOpenRouterProvider } = await import('./openrouter.js')

    expect(() => createOpenRouterProvider()).toThrow('OPENROUTER_API_KEY is not configured')
  })

  it('throws ExtractionProviderError when OPENROUTER_MODEL is missing', async () => {
    vi.stubEnv('OPENROUTER_MODEL', undefined as unknown as string)
    delete process.env.OPENROUTER_MODEL

    const { createOpenRouterProvider } = await import('./openrouter.js')

    expect(() => createOpenRouterProvider()).toThrow('OPENROUTER_MODEL is not configured')
  })
})
