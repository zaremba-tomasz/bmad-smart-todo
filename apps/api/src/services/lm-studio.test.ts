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

describe('LM Studio provider', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    vi.stubEnv('LM_STUDIO_URL', 'http://localhost:1234')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns parsed extraction result on success', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createLMStudioProvider } = await import('./lm-studio.js')
    const provider = createLMStudioProvider()
    const result = await provider.extract('Call the dentist next Monday, high priority')

    expect(result).toEqual(VALID_EXTRACTION)
  })

  it('sends correct OpenAI-compatible request shape', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createLMStudioProvider } = await import('./lm-studio.js')
    const provider = createLMStudioProvider()
    await provider.extract('Call the dentist')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]

    expect(url).toBe('http://localhost:1234/v1/chat/completions')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.model).toBe('local-model')
    expect(body.response_format.type).toBe('json_schema')
    expect(body.response_format.json_schema.name).toBe('extraction_result')
    expect(body.provider).toBeUndefined()
  })

  it('sends only raw text in user message (FR38 privacy)', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createLMStudioProvider } = await import('./lm-studio.js')
    const provider = createLMStudioProvider()
    await provider.extract('Buy groceries')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    const messages = body.messages

    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toBe(EXTRACTION_SYSTEM_PROMPT)
    expect(messages[1].role).toBe('user')
    expect(messages[1].content).toBe('Buy groceries')
  })

  it('does not include Authorization header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createLMStudioProvider } = await import('./lm-studio.js')
    const provider = createLMStudioProvider()
    await provider.extract('test')

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['Authorization']).toBeUndefined()
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('passes AbortController signal to fetch', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createLMStudioProvider } = await import('./lm-studio.js')
    const provider = createLMStudioProvider()
    await provider.extract('test')

    const options = mockFetch.mock.calls[0][1]
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })

  it('throws ExtractionTimeoutError on timeout', async () => {
    mockFetch.mockImplementationOnce(() => {
      const error = new DOMException('The operation was aborted', 'AbortError')
      return Promise.reject(error)
    })

    const { createLMStudioProvider } = await import('./lm-studio.js')
    const provider = createLMStudioProvider()

    await expect(provider.extract('test')).rejects.toThrow('LLM extraction timed out')
  })

  it('treats non-DOMException AbortError as timeout', async () => {
    mockFetch.mockRejectedValueOnce({ name: 'AbortError' })

    const { createLMStudioProvider } = await import('./lm-studio.js')
    const provider = createLMStudioProvider()

    await expect(provider.extract('test')).rejects.toThrow('LLM extraction timed out')
  })

  it('throws ExtractionProviderError on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    const { createLMStudioProvider } = await import('./lm-studio.js')
    const provider = createLMStudioProvider()

    await expect(provider.extract('test')).rejects.toThrow('Provider returned 500')
  })

  it('throws ExtractionProviderError when response has no content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: {} }] }),
    })

    const { createLMStudioProvider } = await import('./lm-studio.js')
    const provider = createLMStudioProvider()

    await expect(provider.extract('test')).rejects.toThrow('No content in provider response')
  })

  it('throws ExtractionProviderError on malformed JSON content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'not json' } }],
      }),
    })

    const { createLMStudioProvider } = await import('./lm-studio.js')
    const provider = createLMStudioProvider()

    await expect(provider.extract('test')).rejects.toThrow()
  })

  it('uses default URL when LM_STUDIO_URL not set', async () => {
    vi.stubEnv('LM_STUDIO_URL', undefined as unknown as string)
    delete process.env.LM_STUDIO_URL
    mockFetch.mockResolvedValueOnce(makeResponse(VALID_EXTRACTION))

    const { createLMStudioProvider } = await import('./lm-studio.js')
    const provider = createLMStudioProvider()
    await provider.extract('test')

    const url = mockFetch.mock.calls[0][0]
    expect(url).toBe('http://localhost:1234/v1/chat/completions')
  })
})
