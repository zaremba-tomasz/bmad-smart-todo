import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = vi.fn()

vi.mock('$lib/stores/capture-store.svelte.js', () => ({
  captureStore: {
    get state() { return mockState() },
    get rawInput() { return '' },
    get extractedFields() { return null },
    get announcement() { return '' },
  },
}))

import AiIndicator from './AiIndicator.svelte'

describe('AiIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.mockReturnValue('idle')
  })

  it('renders "Powered by AI" when state is extracting', () => {
    mockState.mockReturnValue('extracting')
    render(AiIndicator)
    expect(screen.getByText('Powered by AI')).toBeTruthy()
  })

  it('renders "Powered by AI" when state is extracted', () => {
    mockState.mockReturnValue('extracted')
    render(AiIndicator)
    expect(screen.getByText('Powered by AI')).toBeTruthy()
  })

  it('renders "Powered by AI" when state is saving', () => {
    mockState.mockReturnValue('saving')
    render(AiIndicator)
    expect(screen.getByText('Powered by AI')).toBeTruthy()
  })

  it('does not render when state is idle', () => {
    mockState.mockReturnValue('idle')
    render(AiIndicator)
    expect(screen.queryByText('Powered by AI')).toBeNull()
  })

  it('does not render when state is manual', () => {
    mockState.mockReturnValue('manual')
    render(AiIndicator)
    expect(screen.queryByText('Powered by AI')).toBeNull()
  })

  it('has text-secondary styling', () => {
    mockState.mockReturnValue('extracted')
    render(AiIndicator)
    const element = screen.getByText('Powered by AI')
    expect(element.className).toContain('text-text-secondary')
  })
})
