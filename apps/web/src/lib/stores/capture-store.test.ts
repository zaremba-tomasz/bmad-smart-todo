import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

const mockPost = vi.fn()
const mockCreateTask = vi.fn()

vi.mock('$lib/api', () => ({
  api: {
    post: mockPost,
  },
}))

vi.mock('$lib/stores/task-store.svelte.js', () => ({
  taskStore: {
    createTask: (...args: unknown[]) => mockCreateTask(...args),
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
    vi.mock('$lib/stores/task-store.svelte.js', () => ({
      taskStore: {
        createTask: (...args: unknown[]) => mockCreateTask(...args),
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

  it('extraction error (EXTRACTION_TIMEOUT) transitions to manual with extractedFields populated', async () => {
    mockPost.mockResolvedValue({
      ok: false,
      error: { code: 'EXTRACTION_TIMEOUT', message: 'Extraction timed out' },
    })

    await captureStore.submitForExtraction('Some task text')

    expect(captureStore.state).toEqual('manual')
    expect(captureStore.rawInput).toEqual('Some task text')
    expect(captureStore.extractedFields).toEqual({
      title: 'Some task text',
      dueDate: null,
      dueTime: null,
      location: null,
      priority: null,
      recurrence: null,
    })
  })

  it('extraction error (EXTRACTION_PROVIDER_ERROR) transitions to manual with extractedFields populated', async () => {
    mockPost.mockResolvedValue({
      ok: false,
      error: { code: 'EXTRACTION_PROVIDER_ERROR', message: 'Provider failed' },
    })

    await captureStore.submitForExtraction('Another task')

    expect(captureStore.state).toEqual('manual')
    expect(captureStore.rawInput).toEqual('Another task')
    expect(captureStore.extractedFields).toEqual({
      title: 'Another task',
      dueDate: null,
      dueTime: null,
      location: null,
      priority: null,
      recurrence: null,
    })
  })

  it('extraction error (EXTRACTION_VALIDATION_FAILED) transitions to manual with extractedFields populated', async () => {
    mockPost.mockResolvedValue({
      ok: false,
      error: { code: 'EXTRACTION_VALIDATION_FAILED', message: 'Validation failed' },
    })

    await captureStore.submitForExtraction('Bad input')

    expect(captureStore.state).toEqual('manual')
    expect(captureStore.rawInput).toEqual('Bad input')
    expect(captureStore.extractedFields).toEqual({
      title: 'Bad input',
      dueDate: null,
      dueTime: null,
      location: null,
      priority: null,
      recurrence: null,
    })
  })

  it('5s client-side timeout transitions to manual with extractedFields populated', async () => {
    mockPost.mockImplementation(
      () => new Promise(() => { /* never resolves */ }),
    )

    const promise = captureStore.submitForExtraction('Slow task')

    expect(captureStore.state).toEqual('extracting')

    vi.advanceTimersByTime(5_000)
    await promise

    expect(captureStore.state).toEqual('manual')
    expect(captureStore.rawInput).toEqual('Slow task')
    expect(captureStore.extractedFields).toEqual({
      title: 'Slow task',
      dueDate: null,
      dueTime: null,
      location: null,
      priority: null,
      recurrence: null,
    })
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

  it('network error transitions to manual with extractedFields populated', async () => {
    mockPost.mockRejectedValue(new TypeError('Failed to fetch'))

    await captureStore.submitForExtraction('Offline task')

    expect(captureStore.state).toEqual('manual')
    expect(captureStore.rawInput).toEqual('Offline task')
    expect(captureStore.extractedFields).toEqual({
      title: 'Offline task',
      dueDate: null,
      dueTime: null,
      location: null,
      priority: null,
      recurrence: null,
    })
  })

  describe('saveTask()', () => {
    const extractedData = {
      title: 'Buy milk',
      dueDate: '2026-04-22',
      dueTime: '10:00',
      location: 'Store',
      priority: 'high' as const,
      recurrence: null,
    }

    async function setupExtractedState() {
      mockPost.mockResolvedValue({
        ok: true,
        data: { data: extractedData },
      })
      await captureStore.submitForExtraction('Buy milk tomorrow')
      expect(captureStore.state).toEqual('extracted')
    }

    it('calls taskStore.createTask with correctly mapped CreateTaskRequest (no recurrence, groupId: null)', async () => {
      mockCreateTask.mockResolvedValue(undefined)
      await setupExtractedState()

      await captureStore.saveTask()

      expect(mockCreateTask).toHaveBeenCalledWith({
        title: 'Buy milk',
        dueDate: '2026-04-22',
        dueTime: '10:00',
        location: 'Store',
        priority: 'high',
        groupId: null,
      })
    })

    it('transitions state: extracted → saving → idle', async () => {
      let capturedState: string | undefined
      mockCreateTask.mockImplementation(() => {
        capturedState = captureStore.state
        return Promise.resolve()
      })
      await setupExtractedState()

      await captureStore.saveTask()

      expect(capturedState).toEqual('saving')
      expect(captureStore.state).toEqual('idle')
    })

    it('clears rawInput and extractedFields after save', async () => {
      mockCreateTask.mockResolvedValue(undefined)
      await setupExtractedState()

      expect(captureStore.rawInput).toEqual('Buy milk tomorrow')
      expect(captureStore.extractedFields).not.toBeNull()

      await captureStore.saveTask()

      expect(captureStore.rawInput).toEqual('')
      expect(captureStore.extractedFields).toBeNull()
    })

    it('does nothing when state is idle', async () => {
      expect(captureStore.state).toEqual('idle')

      await captureStore.saveTask()

      expect(mockCreateTask).not.toHaveBeenCalled()
    })

    it('does nothing when extractedFields has empty title', async () => {
      mockPost.mockResolvedValue({
        ok: true,
        data: {
          data: { ...extractedData, title: '   ' },
        },
      })
      await captureStore.submitForExtraction('test')

      await captureStore.saveTask()

      expect(mockCreateTask).not.toHaveBeenCalled()
    })

    it('saveTask() works correctly from manual state', async () => {
      mockCreateTask.mockResolvedValue(undefined)
      mockPost.mockResolvedValue({
        ok: false,
        error: { code: 'EXTRACTION_TIMEOUT', message: 'Timeout' },
      })
      await captureStore.submitForExtraction('Manual task')
      expect(captureStore.state).toEqual('manual')
      expect(captureStore.extractedFields).not.toBeNull()

      const result = captureStore.saveTask()

      expect(result).toBe(true)
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: 'Manual task',
        dueDate: null,
        dueTime: null,
        location: null,
        priority: null,
        groupId: null,
      })
      expect(captureStore.state).toEqual('idle')
    })

    it('allows immediate re-extraction after save (rapid re-entry)', async () => {
      mockCreateTask.mockResolvedValue(undefined)
      await setupExtractedState()

      captureStore.saveTask()

      expect(captureStore.state).toEqual('idle')
      expect(captureStore.rawInput).toEqual('')

      mockPost.mockResolvedValue({
        ok: true,
        data: {
          data: {
            title: 'Second task',
            dueDate: null,
            dueTime: null,
            location: null,
            priority: null,
            recurrence: null,
          },
        },
      })

      await captureStore.submitForExtraction('Second task right away')

      expect(captureStore.state).toEqual('extracted')
      expect(captureStore.extractedFields?.title).toEqual('Second task')
    })

    it('resets immediately even if createTask rejects', async () => {
      mockCreateTask.mockRejectedValue(new Error('save failed'))
      await setupExtractedState()

      const result = captureStore.saveTask()

      expect(result).toBe(true)
      expect(captureStore.state).toEqual('idle')
      expect(captureStore.rawInput).toEqual('')
      expect(captureStore.extractedFields).toBeNull()
      await Promise.resolve()
    })
  })

  describe('updateField()', () => {
    it('updates extractedFields with new value', async () => {
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

      captureStore.updateField('priority', 'high')

      expect(captureStore.extractedFields?.priority).toEqual('high')
    })

    it('updates title field', async () => {
      mockPost.mockResolvedValue({
        ok: true,
        data: {
          data: {
            title: 'Original',
            dueDate: null,
            dueTime: null,
            location: null,
            priority: null,
            recurrence: null,
          },
        },
      })
      await captureStore.submitForExtraction('Original')

      captureStore.updateField('title', 'New title')

      expect(captureStore.extractedFields?.title).toEqual('New title')
    })

    it('does nothing when extractedFields is null', () => {
      expect(captureStore.extractedFields).toBeNull()

      captureStore.updateField('title', 'Test')

      expect(captureStore.extractedFields).toBeNull()
    })
  })

  describe('cancelExtraction()', () => {
    it('resets state to idle, preserves rawInput, and ignores timeout completion', async () => {
      mockPost.mockImplementation(() => new Promise(() => {}))
      const promise = captureStore.submitForExtraction('Some task')

      expect(captureStore.state).toEqual('extracting')
      expect(captureStore.rawInput).toEqual('Some task')

      captureStore.cancelExtraction()

      expect(captureStore.state).toEqual('idle')
      expect(captureStore.rawInput).toEqual('Some task')
      expect(captureStore.extractedFields).toBeNull()

      vi.advanceTimersByTime(5_000)
      await promise

      expect(captureStore.state).toEqual('idle')
      expect(captureStore.extractedFields).toBeNull()
    })

    it('ignores a late successful extraction response after cancellation', async () => {
      let resolvePost: ((value: unknown) => void) | undefined
      mockPost.mockImplementation(
        () => new Promise((resolve) => { resolvePost = resolve }),
      )

      const promise = captureStore.submitForExtraction('Late success')
      expect(captureStore.state).toEqual('extracting')

      captureStore.cancelExtraction()
      resolvePost?.({
        ok: true,
        data: {
          data: {
            title: 'Should not apply',
            dueDate: null,
            dueTime: null,
            location: null,
            priority: null,
            recurrence: null,
          },
        },
      })
      await promise

      expect(captureStore.state).toEqual('idle')
      expect(captureStore.rawInput).toEqual('Late success')
      expect(captureStore.extractedFields).toBeNull()
    })
  })
})
