import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

const mockPost = vi.fn()

vi.mock('$lib/api', () => ({
  api: {
    post: mockPost,
  },
}))

let captureStore: typeof import('./capture-store.svelte').captureStore

describe('captureStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.useFakeTimers()

    vi.mock('$lib/api', () => ({
      api: {
        post: mockPost,
      },
    }))
    ;({ captureStore } = await import('./capture-store.svelte'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with idle state and empty rawInput', () => {
    expect(captureStore.state).toEqual('idle')
    expect(captureStore.rawInput).toEqual('')
    expect(captureStore.extractedFields).toBeNull()
  })

  it('submitForExtraction transitions to extracting and calls api.post', async () => {
    mockPost.mockResolvedValue({
      ok: true,
      data: {
        data: {
          title: 'Buy milk',
          dueDate: null,
          dueTime: null,
          location: null,
          priority: null,
          recurrence: null,
        },
      },
    })

    const promise = captureStore.submitForExtraction('Buy milk')

    expect(captureStore.state).toEqual('extracting')
    expect(captureStore.rawInput).toEqual('Buy milk')

    await promise

    expect(mockPost).toHaveBeenCalledWith(
      '/api/extract',
      { text: 'Buy milk' },
      expect.anything(),
    )
  })

  it('successful extraction transitions to extracted with fields populated', async () => {
    const extractedData = {
      title: 'Buy milk',
      dueDate: '2026-04-22',
      dueTime: '10:00',
      location: 'Grocery store',
      priority: 'medium' as const,
      recurrence: null,
    }

    mockPost.mockResolvedValue({
      ok: true,
      data: { data: extractedData },
    })

    await captureStore.submitForExtraction('Buy milk tomorrow at 10am at grocery store')

    expect(captureStore.state).toEqual('extracted')
    expect(captureStore.extractedFields).toEqual(extractedData)
    expect(captureStore.rawInput).toEqual('Buy milk tomorrow at 10am at grocery store')
  })

  it('extraction error (EXTRACTION_TIMEOUT) transitions to manual with rawInput preserved', async () => {
    mockPost.mockResolvedValue({
      ok: false,
      error: { code: 'EXTRACTION_TIMEOUT', message: 'Extraction timed out' },
    })

    await captureStore.submitForExtraction('Some task text')

    expect(captureStore.state).toEqual('manual')
    expect(captureStore.rawInput).toEqual('Some task text')
    expect(captureStore.extractedFields).toBeNull()
  })

  it('extraction error (EXTRACTION_PROVIDER_ERROR) transitions to manual', async () => {
    mockPost.mockResolvedValue({
      ok: false,
      error: { code: 'EXTRACTION_PROVIDER_ERROR', message: 'Provider failed' },
    })

    await captureStore.submitForExtraction('Another task')

    expect(captureStore.state).toEqual('manual')
    expect(captureStore.rawInput).toEqual('Another task')
  })

  it('extraction error (EXTRACTION_VALIDATION_FAILED) transitions to manual', async () => {
    mockPost.mockResolvedValue({
      ok: false,
      error: { code: 'EXTRACTION_VALIDATION_FAILED', message: 'Validation failed' },
    })

    await captureStore.submitForExtraction('Bad input')

    expect(captureStore.state).toEqual('manual')
    expect(captureStore.rawInput).toEqual('Bad input')
  })

  it('5s client-side timeout transitions to manual', async () => {
    mockPost.mockImplementation(
      () => new Promise(() => { /* never resolves */ }),
    )

    const promise = captureStore.submitForExtraction('Slow task')

    expect(captureStore.state).toEqual('extracting')

    vi.advanceTimersByTime(5_000)
    await promise

    expect(captureStore.state).toEqual('manual')
    expect(captureStore.rawInput).toEqual('Slow task')
  })

  it('clears timeout timer when request resolves before timeout', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    mockPost.mockResolvedValue({
      ok: true,
      data: {
        data: {
          title: 'Fast task',
          dueDate: null,
          dueTime: null,
          location: null,
          priority: null,
          recurrence: null,
        },
      },
    })

    await captureStore.submitForExtraction('Fast task')

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  it('resetCapture returns to idle', async () => {
    mockPost.mockResolvedValue({
      ok: true,
      data: {
        data: {
          title: 'Test',
          dueDate: null,
          dueTime: null,
          location: null,
          priority: null,
          recurrence: null,
        },
      },
    })

    await captureStore.submitForExtraction('Test')
    expect(captureStore.state).toEqual('extracted')

    captureStore.resetCapture()

    expect(captureStore.state).toEqual('idle')
    expect(captureStore.rawInput).toEqual('')
    expect(captureStore.extractedFields).toBeNull()
  })

  it('empty text submission is rejected and does not call API', async () => {
    await captureStore.submitForExtraction('')

    expect(mockPost).not.toHaveBeenCalled()
    expect(captureStore.state).toEqual('idle')
  })

  it('whitespace-only text submission is rejected', async () => {
    await captureStore.submitForExtraction('   ')

    expect(mockPost).not.toHaveBeenCalled()
    expect(captureStore.state).toEqual('idle')
  })

  it('setRawInput updates rawInput', () => {
    captureStore.setRawInput('Hello')
    expect(captureStore.rawInput).toEqual('Hello')
  })

  it('network error transitions to manual', async () => {
    mockPost.mockRejectedValue(new TypeError('Failed to fetch'))

    await captureStore.submitForExtraction('Offline task')

    expect(captureStore.state).toEqual('manual')
    expect(captureStore.rawInput).toEqual('Offline task')
  })
})
