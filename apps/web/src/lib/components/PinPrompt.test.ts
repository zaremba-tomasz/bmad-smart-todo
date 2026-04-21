import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/stores/capture-store.svelte.js', () => ({
  captureStore: {
    get state() { return 'idle' },
    get rawInput() { return '' },
    get extractedFields() { return null },
    get announcement() { return '' },
  },
}))

import PinPrompt from './PinPrompt.svelte'

describe('PinPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows banner on desktop when not previously dismissed', () => {
    render(PinPrompt, { props: { isDesktopViewport: true, onDismiss: vi.fn() } })
    expect(screen.getByText('Pin this tab for quick access')).toBeTruthy()
  })

  it('does not show banner on mobile', () => {
    render(PinPrompt, { props: { isDesktopViewport: false, onDismiss: vi.fn() } })
    expect(screen.queryByText('Pin this tab for quick access')).toBeNull()
  })

  it('does not show banner when previously dismissed via localStorage', () => {
    localStorage.setItem('smart-todo:pin-prompt-dismissed', 'true')
    render(PinPrompt, { props: { isDesktopViewport: true, onDismiss: vi.fn() } })
    expect(screen.queryByText('Pin this tab for quick access')).toBeNull()
  })

  it('dismiss button click hides banner and sets localStorage', async () => {
    const onDismiss = vi.fn()
    render(PinPrompt, { props: { isDesktopViewport: true, onDismiss } })

    const dismissBtn = screen.getByLabelText('Dismiss pin prompt')
    await fireEvent.click(dismissBtn)

    expect(screen.queryByText('Pin this tab for quick access')).toBeNull()
    expect(localStorage.getItem('smart-todo:pin-prompt-dismissed')).toBe('true')
    expect(onDismiss).toHaveBeenCalled()
  })

  it('Escape key dismisses banner and sets localStorage', async () => {
    const onDismiss = vi.fn()
    render(PinPrompt, { props: { isDesktopViewport: true, onDismiss } })

    expect(screen.getByText('Pin this tab for quick access')).toBeTruthy()

    await fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByText('Pin this tab for quick access')).toBeNull()
    expect(localStorage.getItem('smart-todo:pin-prompt-dismissed')).toBe('true')
    expect(onDismiss).toHaveBeenCalled()
  })

  it('click outside dismisses banner', async () => {
    const onDismiss = vi.fn()
    render(PinPrompt, { props: { isDesktopViewport: true, onDismiss } })

    expect(screen.getByText('Pin this tab for quick access')).toBeTruthy()

    await fireEvent.click(document.body)

    expect(screen.queryByText('Pin this tab for quick access')).toBeNull()
    expect(onDismiss).toHaveBeenCalled()
  })

  it('has role="status" and aria-live="polite"', () => {
    render(PinPrompt, { props: { isDesktopViewport: true, onDismiss: vi.fn() } })
    const banner = screen.getByRole('status')
    expect(banner).toBeTruthy()
    expect(banner.getAttribute('aria-live')).toBe('polite')
  })

  it('calls onDismiss callback when dismissed', async () => {
    const onDismiss = vi.fn()
    render(PinPrompt, { props: { isDesktopViewport: true, onDismiss } })

    const dismissBtn = screen.getByLabelText('Dismiss pin prompt')
    await fireEvent.click(dismissBtn)

    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
