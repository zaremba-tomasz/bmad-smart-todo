import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatRelativeDate } from './format'

describe('formatRelativeDate', () => {
  const FIXED_NOW = new Date(2026, 3, 20) // April 20, 2026 (Monday)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty string for null input', () => {
    expect(formatRelativeDate(null)).toBe('')
  })

  it('returns empty string for invalid date string', () => {
    expect(formatRelativeDate('not-a-date')).toBe('')
  })

  it('returns "Today" for today\'s date', () => {
    expect(formatRelativeDate('2026-04-20')).toBe('Today')
  })

  it('accepts ISO datetime strings by using their date portion', () => {
    expect(formatRelativeDate('2026-04-20T17:30:00.000Z')).toBe('Today')
  })

  it('returns "Tomorrow" for tomorrow\'s date', () => {
    expect(formatRelativeDate('2026-04-21')).toBe('Tomorrow')
  })

  it('returns "Yesterday" for yesterday\'s date', () => {
    expect(formatRelativeDate('2026-04-19')).toBe('Yesterday')
  })

  it('returns day name for this week (2-6 days ahead)', () => {
    // April 20 is Monday, April 22 is Wednesday (2 days ahead)
    expect(formatRelativeDate('2026-04-22')).toBe('Wednesday')
    // April 25 is Saturday (5 days ahead)
    expect(formatRelativeDate('2026-04-25')).toBe('Saturday')
    // April 26 is Sunday (6 days ahead)
    expect(formatRelativeDate('2026-04-26')).toBe('Sunday')
  })

  it('returns "Next {Day}" for next week (7-13 days ahead)', () => {
    // April 27 is Monday (7 days ahead)
    expect(formatRelativeDate('2026-04-27')).toBe('Next Monday')
    // May 2 is Saturday (12 days ahead)
    expect(formatRelativeDate('2026-05-02')).toBe('Next Saturday')
    // May 3 is Sunday (13 days ahead)
    expect(formatRelativeDate('2026-05-03')).toBe('Next Sunday')
  })

  it('returns abbreviated month + day for same year further away', () => {
    expect(formatRelativeDate('2026-06-15')).toBe('Jun 15')
    expect(formatRelativeDate('2026-12-25')).toBe('Dec 25')
  })

  it('returns abbreviated month + day + year for different year', () => {
    expect(formatRelativeDate('2027-04-28')).toBe('Apr 28 2027')
    expect(formatRelativeDate('2025-01-15')).toBe('Jan 15 2025')
  })

  it('handles dates further in the past (same year) with month + day', () => {
    expect(formatRelativeDate('2026-01-05')).toBe('Jan 5')
  })

  it('returns empty string for impossible calendar dates', () => {
    expect(formatRelativeDate('2026-02-31')).toBe('')
    expect(formatRelativeDate('2026-13-10')).toBe('')
  })

  it('handles edge case of midnight boundaries via day-level comparison', () => {
    vi.setSystemTime(new Date(2026, 3, 20, 23, 59, 59))
    expect(formatRelativeDate('2026-04-20')).toBe('Today')
    expect(formatRelativeDate('2026-04-21')).toBe('Tomorrow')
  })
})
