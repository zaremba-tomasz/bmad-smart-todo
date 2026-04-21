import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSubmitForExtraction = vi.fn()
const mockSetRawInput = vi.fn()
const mockResetCapture = vi.fn()
const mockSaveTask = vi.fn()
const mockState = vi.fn()
const mockRawInput = vi.fn()

vi.mock('$lib/stores/capture-store.svelte.js', () => ({
  captureStore: {
    submitForExtraction: (...args: unknown[]) => mockSubmitForExtraction(...args),
    setRawInput: (...args: unknown[]) => mockSetRawInput(...args),
    resetCapture: (...args: unknown[]) => mockResetCapture(...args),
    saveTask: (...args: unknown[]) => mockSaveTask(...args),
    get state() { return mockState() },
    get rawInput() { return mockRawInput() },
    get extractedFields() { return null },
  },
}))

import CaptureInput from './CaptureInput.svelte'

describe('CaptureInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.mockReturnValue('idle')
    mockRawInput.mockReturnValue('')
  })

  it('renders input with placeholder "Call the dentist next Monday, high priority"', () => {
    render(CaptureInput, { props: { autofocus: false } })
    const input = screen.getByPlaceholderText('Call the dentist next Monday, high priority')
    expect(input).toBeTruthy()
  })

  it('input has aria-label="Add a task"', () => {
    render(CaptureInput, { props: { autofocus: false } })
    const input = screen.getByLabelText('Add a task')
    expect(input).toBeTruthy()
    expect(input.tagName).toBe('INPUT')
  })

  it('submit button has aria-label="Submit task"', () => {
    render(CaptureInput, { props: { autofocus: false } })
    const button = screen.getByLabelText('Submit task')
    expect(button).toBeTruthy()
    expect(button.tagName).toBe('BUTTON')
  })

  it('pressing Enter with text calls captureStore.submitForExtraction', async () => {
    mockRawInput.mockReturnValue('')
    render(CaptureInput, { props: { autofocus: false } })

    const input = screen.getByLabelText('Add a task') as HTMLInputElement

    await fireEvent.input(input, { target: { value: 'Buy milk tomorrow' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockSubmitForExtraction).toHaveBeenCalledWith('Buy milk tomorrow')
  })

  it('pressing Enter with empty text does not submit', async () => {
    mockRawInput.mockReturnValue('')
    render(CaptureInput, { props: { autofocus: false } })

    const input = screen.getByLabelText('Add a task') as HTMLInputElement

    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockSubmitForExtraction).not.toHaveBeenCalled()
  })

  it('input is visually muted when captureStore state is extracting', () => {
    mockState.mockReturnValue('extracting')
    render(CaptureInput, { props: { autofocus: false } })

    const input = screen.getByLabelText('Add a task') as HTMLInputElement
    expect(input.disabled).toBe(true)
    expect(input.className).toContain('opacity-50')
  })

  it('input is disabled when captureStore state is saving', () => {
    mockState.mockReturnValue('saving')
    render(CaptureInput, { props: { autofocus: false } })

    const input = screen.getByLabelText('Add a task') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })

  it('keyboard shortcut / focuses the input (when not already in an input)', async () => {
    render(CaptureInput, { props: { autofocus: true } })

    const input = screen.getByLabelText('Add a task') as HTMLInputElement
    input.blur()

    await fireEvent.keyDown(window, { key: '/' })

    expect(document.activeElement).toBe(input)
  })

  it('keyboard shortcut Ctrl+K focuses the input', async () => {
    render(CaptureInput, { props: { autofocus: true } })

    const input = screen.getByLabelText('Add a task') as HTMLInputElement
    input.blur()

    await fireEvent.keyDown(window, { key: 'k', ctrlKey: true })

    expect(document.activeElement).toBe(input)
  })

  it('keyboard shortcut does not focus input on mobile viewport', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, media: '(min-width: 768px)' }) as any
    try {
      render(CaptureInput, { props: { autofocus: true } })
      const input = screen.getByLabelText('Add a task') as HTMLInputElement
      input.blur()

      await fireEvent.keyDown(window, { key: '/' })

      expect(document.activeElement).not.toBe(input)
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('keyboard shortcut does not fire when focus is inside an input', async () => {
    render(CaptureInput, { props: { autofocus: true } })

    const input = screen.getByLabelText('Add a task') as HTMLInputElement
    input.focus()

    const prevented = vi.fn()
    const event = new KeyboardEvent('keydown', { key: '/', bubbles: true })
    Object.defineProperty(event, 'target', { value: input })
    vi.spyOn(event, 'preventDefault').mockImplementation(prevented)

    window.dispatchEvent(event)

    expect(prevented).not.toHaveBeenCalled()
  })

  it('submit button click calls submitForExtraction', async () => {
    mockRawInput.mockReturnValue('')
    render(CaptureInput, { props: { autofocus: false } })

    const input = screen.getByLabelText('Add a task') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Walk the dog' } })

    const button = screen.getByLabelText('Submit task')
    await fireEvent.click(button)

    expect(mockSubmitForExtraction).toHaveBeenCalledWith('Walk the dog')
  })

  it('ignores Enter while IME composition is in progress', () => {
    render(CaptureInput, { props: { autofocus: false } })
    const input = screen.getByLabelText('Add a task') as HTMLInputElement
    input.value = 'Buy milk'

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    Object.defineProperty(event, 'isComposing', { value: true })
    input.dispatchEvent(event)

    expect(mockSubmitForExtraction).not.toHaveBeenCalled()
  })

  it('has aria-describedby referencing the description element', () => {
    render(CaptureInput, { props: { autofocus: false } })
    const input = screen.getByLabelText('Add a task')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toMatch(/^capture-input-description-\d+$/)

    const description = document.getElementById(describedBy ?? '')
    expect(description).toBeTruthy()
    expect(description?.textContent).toContain('Call the dentist next Monday, high priority')
  })

  describe('type-ahead / burst mode', () => {
    it('calls saveTask and starts new extraction when typing while state is extracted', async () => {
      mockState.mockReturnValue('extracted')
      mockRawInput.mockReturnValue('Buy milk tomorrow')
      mockSaveTask.mockReturnValue(true)

      render(CaptureInput, { props: { autofocus: false } })
      const input = screen.getByLabelText('Add a task') as HTMLInputElement

      await fireEvent.input(input, { target: { value: 'Buy milk tomorrowW' }, inputType: 'insertText', data: 'W' })

      expect(mockSaveTask).toHaveBeenCalled()
      expect(mockSubmitForExtraction).toHaveBeenCalledWith('W')
    })

    it('calls saveTask when typing while state is manual', async () => {
      mockState.mockReturnValue('manual')
      mockRawInput.mockReturnValue('Some task')
      mockSaveTask.mockReturnValue(true)

      render(CaptureInput, { props: { autofocus: false } })
      const input = screen.getByLabelText('Add a task') as HTMLInputElement

      await fireEvent.input(input, { target: { value: 'Some taskX' }, inputType: 'insertText', data: 'X' })

      expect(mockSaveTask).toHaveBeenCalled()
    })

    it('sets rawInput to only the newly typed characters after burst save', async () => {
      mockState.mockReturnValue('extracted')
      mockRawInput.mockReturnValue('Buy milk')
      mockSaveTask.mockReturnValue(true)

      render(CaptureInput, { props: { autofocus: false } })
      const input = screen.getByLabelText('Add a task') as HTMLInputElement

      await fireEvent.input(input, { target: { value: 'Buy milkW' }, inputType: 'insertText', data: 'W' })

      expect(mockSetRawInput).toHaveBeenCalledWith('W')
    })

    it('uses inserted text when user types at the beginning (non-append edit)', async () => {
      mockState.mockReturnValue('extracted')
      mockRawInput.mockReturnValue('Buy milk')
      mockSaveTask.mockReturnValue(true)

      render(CaptureInput, { props: { autofocus: false } })
      const input = screen.getByLabelText('Add a task') as HTMLInputElement

      await fireEvent.input(input, { target: { value: 'XBuy milk' }, inputType: 'insertText', data: 'X' })

      expect(mockSetRawInput).toHaveBeenCalledWith('X')
      expect(mockSubmitForExtraction).toHaveBeenCalledWith('X')
    })

    it('does not call saveTask during idle state', async () => {
      mockState.mockReturnValue('idle')
      mockRawInput.mockReturnValue('')

      render(CaptureInput, { props: { autofocus: false } })
      const input = screen.getByLabelText('Add a task') as HTMLInputElement

      await fireEvent.input(input, { target: { value: 'Hello' } })

      expect(mockSaveTask).not.toHaveBeenCalled()
      expect(mockSetRawInput).toHaveBeenCalledWith('Hello')
    })

    it('does not call saveTask during extracting state', async () => {
      mockState.mockReturnValue('extracting')
      mockRawInput.mockReturnValue('')

      render(CaptureInput, { props: { autofocus: false } })
      const input = screen.getByLabelText('Add a task') as HTMLInputElement

      await fireEvent.input(input, { target: { value: 'Hello' } })

      expect(mockSaveTask).not.toHaveBeenCalled()
    })

    it('does not call saveTask for non-insert input changes while form is showing', async () => {
      mockState.mockReturnValue('extracted')
      mockRawInput.mockReturnValue('Buy milk')

      render(CaptureInput, { props: { autofocus: false } })
      const input = screen.getByLabelText('Add a task') as HTMLInputElement

      await fireEvent.input(input, { target: { value: 'Buy mil' }, inputType: 'deleteContentBackward' })

      expect(mockSaveTask).not.toHaveBeenCalled()
      expect(mockSetRawInput).toHaveBeenCalledWith('Buy mil')
    })

    it('falls back to setRawInput when saveTask returns false', async () => {
      mockState.mockReturnValue('extracted')
      mockRawInput.mockReturnValue('Buy milk')
      mockSaveTask.mockReturnValue(false)

      render(CaptureInput, { props: { autofocus: false } })
      const input = screen.getByLabelText('Add a task') as HTMLInputElement

      await fireEvent.input(input, { target: { value: 'Buy milkX' }, inputType: 'insertText', data: 'X' })

      expect(mockSaveTask).toHaveBeenCalled()
      expect(mockSetRawInput).toHaveBeenCalledWith('Buy milkX')
    })
  })
})
