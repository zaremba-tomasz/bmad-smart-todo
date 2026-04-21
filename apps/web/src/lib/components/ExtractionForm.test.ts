import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let mockState = 'idle'
let mockExtractedFields: Record<string, unknown> | null = null
const mockSaveTask = vi.fn()
const mockUpdateField = vi.fn()
const mockSetAnnouncement = vi.fn()

vi.mock('$lib/stores/capture-store.svelte.js', () => ({
  captureStore: {
    get state() { return mockState },
    get extractedFields() { return mockExtractedFields },
    get announcement() { return '' },
    saveTask: (...args: unknown[]) => mockSaveTask(...args),
    updateField: (...args: unknown[]) => mockUpdateField(...args),
    setAnnouncement: (...args: unknown[]) => mockSetAnnouncement(...args),
    resetCapture: vi.fn(),
  },
}))

import ExtractionForm from './ExtractionForm.svelte'

function setStoreState(state: string, fields: Record<string, unknown> | null = null) {
  mockState = state
  mockExtractedFields = fields
}

const fullFields = {
  title: 'Buy groceries',
  dueDate: '2026-04-25',
  dueTime: '10:00',
  location: 'Grocery store',
  priority: 'high' as const,
  recurrence: null,
}

const partialFields = {
  title: 'Call dentist',
  dueDate: '2026-04-22',
  dueTime: null,
  location: null,
  priority: null,
  recurrence: null,
}

describe('ExtractionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockState = 'idle'
    mockExtractedFields = null
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  describe('shimmer states', () => {
    it('shows no shimmer when extracting state is <800ms', () => {
      setStoreState('extracting')
      render(ExtractionForm)

      vi.advanceTimersByTime(799)

      const shimmerBars = document.querySelectorAll('.shimmer-bar')
      expect(shimmerBars.length).toBe(0)
    })

    it('shows shimmer after 800ms of extracting state', async () => {
      setStoreState('extracting')
      render(ExtractionForm)

      vi.advanceTimersByTime(800)
      await tick()

      const shimmerBars = document.querySelectorAll('.shimmer-bar')
      expect(shimmerBars.length).toBeGreaterThan(0)
    })

    it('shows "Processing..." text for prefers-reduced-motion', async () => {
      setStoreState('extracting')
      render(ExtractionForm)

      vi.advanceTimersByTime(800)
      await tick()

      const processingText = screen.getByText('Processing...')
      expect(processingText).toBeTruthy()
    })

    it('announces "Processing your task..." via ARIA live region after 800ms', async () => {
      setStoreState('extracting')
      render(ExtractionForm)

      vi.advanceTimersByTime(800)
      await tick()

      expect(mockSetAnnouncement).toHaveBeenCalledWith('Processing your task...')
    })
  })

  describe('extracted field display', () => {
    it('renders only populated fields (title + dueDate, not location/priority when null)', () => {
      setStoreState('extracted', partialFields)
      render(ExtractionForm)

      expect(screen.getByLabelText('Title')).toBeTruthy()
      expect(screen.getByLabelText('Due date')).toBeTruthy()
      expect(screen.queryByLabelText('Due time')).toBeNull()
      expect(screen.queryByLabelText('Priority')).toBeNull()
      expect(screen.queryByLabelText('Location')).toBeNull()
    })

    it('renders all populated fields when all are present', () => {
      setStoreState('extracted', fullFields)
      render(ExtractionForm)

      expect(screen.getByLabelText('Title')).toBeTruthy()
      expect(screen.getByLabelText('Due date')).toBeTruthy()
      expect(screen.getByLabelText('Due time')).toBeTruthy()
      expect(screen.getByText('High')).toBeTruthy()
      expect(screen.getByLabelText('Location')).toBeTruthy()
    })

    it('AI-populated fields have surface-extracted background class', () => {
      setStoreState('extracted', fullFields)
      render(ExtractionForm)

      const titleInput = screen.getByLabelText('Title')
      expect(titleInput.className).toContain('bg-surface-extracted')
    })

    it('editing a field removes surface-extracted background', async () => {
      setStoreState('extracted', fullFields)
      render(ExtractionForm)

      const titleInput = screen.getByLabelText('Title') as HTMLInputElement
      expect(titleInput.className).toContain('bg-surface-extracted')

      await fireEvent.input(titleInput, { target: { value: 'Updated title' } })

      expect(titleInput.className).toContain('bg-surface-raised')
      expect(titleInput.className).not.toContain('bg-surface-extracted')
    })
  })

  describe('+ Add controls', () => {
    it('"+ Add date" control appears when dueDate is null after 500ms', () => {
      setStoreState('extracted', partialFields)
      render(ExtractionForm)

      vi.advanceTimersByTime(500)

      expect(screen.queryByText('+ Add date')).toBeNull()
    })

    it('"+ Add date" appears when dueDate is null after 500ms', async () => {
      setStoreState('extracted', { ...partialFields, dueDate: null })
      render(ExtractionForm)

      vi.advanceTimersByTime(500)
      await tick()

      expect(screen.getByText('+ Add date')).toBeTruthy()
    })

    it('"+ Add priority" button visible when priority is null after 500ms', async () => {
      setStoreState('extracted', partialFields)
      render(ExtractionForm)

      vi.advanceTimersByTime(500)
      await tick()

      expect(screen.getByText('+ Add priority')).toBeTruthy()
    })

    it('"+ Add time" button visible when dueTime is null after 500ms', async () => {
      setStoreState('extracted', partialFields)
      render(ExtractionForm)

      vi.advanceTimersByTime(500)
      await tick()

      expect(screen.getByText('+ Add time')).toBeTruthy()
    })

    it('"+ Add location" button visible when location is null after 500ms', async () => {
      setStoreState('extracted', partialFields)
      render(ExtractionForm)

      vi.advanceTimersByTime(500)
      await tick()

      expect(screen.getByText('+ Add location')).toBeTruthy()
    })

    it('clicking "+ Add date" reveals an editable date field', async () => {
      setStoreState('extracted', { ...partialFields, dueDate: null })
      render(ExtractionForm)

      vi.advanceTimersByTime(500)
      await tick()

      const addDateBtn = screen.getByText('+ Add date')
      await fireEvent.click(addDateBtn)

      expect(screen.getByLabelText('Due date')).toBeTruthy()
      expect(screen.queryByText('+ Add date')).toBeNull()
    })
  })

  describe('save flow', () => {
    it('Save button calls captureStore.saveTask()', async () => {
      mockSaveTask.mockResolvedValue(undefined)
      setStoreState('extracted', fullFields)
      render(ExtractionForm)

      const saveBtn = screen.getByRole('button', { name: 'Save' })
      await fireEvent.click(saveBtn)

      expect(mockUpdateField).toHaveBeenCalled()
      expect(mockSaveTask).toHaveBeenCalled()
    })

    it('Save with empty title shows inline error and focuses title field', async () => {
      setStoreState('extracted', { ...fullFields, title: '' })
      render(ExtractionForm)

      const titleInput = screen.getByLabelText('Title') as HTMLInputElement
      await fireEvent.input(titleInput, { target: { value: '' } })

      const saveBtn = screen.getByRole('button', { name: 'Save' })
      await fireEvent.click(saveBtn)

      expect(screen.getByText('Title is required')).toBeTruthy()
      expect(mockSaveTask).not.toHaveBeenCalled()
    })

    it('Save button is never disabled when in extracted state', () => {
      setStoreState('extracted', fullFields)
      render(ExtractionForm)

      const saveBtn = screen.getByRole('button', { name: 'Save' })
      expect(saveBtn.getAttribute('disabled')).toBeNull()
    })
  })

  describe('ARIA accessibility', () => {
    it('ARIA live region contains extraction announcement text', () => {
      setStoreState('extracted', fullFields)
      render(ExtractionForm)

      expect(mockSetAnnouncement).toHaveBeenCalledWith(
        expect.stringContaining('Task details extracted'),
      )
      expect(mockSetAnnouncement).toHaveBeenCalledWith(
        expect.stringContaining('Title: Buy groceries'),
      )
    })

    it('tab order is title → date → time → priority → location → Save', () => {
      setStoreState('extracted', fullFields)
      render(ExtractionForm)

      const titleInput = screen.getByLabelText('Title')
      const dateField = screen.getByLabelText('Due date')
      const timeField = screen.getByLabelText('Due time')
      const priorityField = screen.getByLabelText('Priority')
      const locationField = screen.getByLabelText('Location')
      const saveBtn = screen.getByRole('button', { name: 'Save' })

      expect(titleInput.compareDocumentPosition(dateField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(dateField.compareDocumentPosition(timeField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(timeField.compareDocumentPosition(priorityField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(priorityField.compareDocumentPosition(locationField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(locationField.compareDocumentPosition(saveBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('title validation error has role="alert"', async () => {
      setStoreState('extracted', { ...fullFields, title: '  ' })
      render(ExtractionForm)

      const titleInput = screen.getByLabelText('Title') as HTMLInputElement
      await fireEvent.input(titleInput, { target: { value: '' } })

      const saveBtn = screen.getByRole('button', { name: 'Save' })
      await fireEvent.click(saveBtn)

      const alert = screen.getByRole('alert')
      expect(alert.textContent).toBe('Title is required')
    })
  })

  describe('form not rendered in idle state', () => {
    it('does not render form content when state is idle', () => {
      setStoreState('idle')
      render(ExtractionForm)

      expect(screen.queryByLabelText('Title')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    })
  })
})
