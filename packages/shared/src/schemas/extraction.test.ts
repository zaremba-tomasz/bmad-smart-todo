import { describe, it, expect } from 'vitest'

import { ExtractionResultSchema } from './extraction'

describe('ExtractionResultSchema', () => {
  it('validates an extraction with recurrence', () => {
    const extraction = {
      title: 'Weekly standup',
      dueDate: '2026-04-21',
      dueTime: '09:00',
      location: 'Conference Room A',
      priority: 'medium' as const,
      recurrence: {
        pattern: 'weekly' as const,
        interval: 1,
        dayOfWeek: 'Monday',
        dayOfMonth: null,
      },
    }

    const result = ExtractionResultSchema.safeParse(extraction)
    expect(result.success).toBe(true)
  })

  it('validates an extraction without recurrence', () => {
    const extraction = {
      title: 'Buy milk',
      dueDate: null,
      dueTime: null,
      location: null,
      priority: null,
      recurrence: null,
    }

    const result = ExtractionResultSchema.safeParse(extraction)
    expect(result.success).toBe(true)
  })

  it('rejects an empty title', () => {
    const extraction = {
      title: '',
      dueDate: null,
      dueTime: null,
      location: null,
      priority: null,
      recurrence: null,
    }

    const result = ExtractionResultSchema.safeParse(extraction)
    expect(result.success).toBe(false)
  })
})
