import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import EmptyState from './EmptyState.svelte'

describe('EmptyState', () => {
  it('renders "Your task list is clear." text', () => {
    render(EmptyState)
    expect(screen.getByText('Your task list is clear.')).toBeTruthy()
  })

  it('renders warm icon (SVG present)', () => {
    const { container } = render(EmptyState)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })

  it('component renders without props', () => {
    const { container } = render(EmptyState)
    expect(container.innerHTML).toBeTruthy()
    expect(screen.getByText('Your task list is clear.')).toBeTruthy()
  })
})
