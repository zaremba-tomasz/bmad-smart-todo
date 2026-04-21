import { ExtractionResultSchema, ApiSuccessSchema } from '@smart-todo/shared'
import type { z } from 'zod'

import { api } from '$lib/api.js'
import type { CaptureState } from '$lib/types/index.js'

const ExtractionResponseSchema = ApiSuccessSchema(ExtractionResultSchema)
type ExtractionResult = z.infer<typeof ExtractionResultSchema>

const EXTRACTION_TIMEOUT_MS = 5_000

let state = $state<CaptureState>('idle')
let rawInput = $state('')
let extractedFields = $state<ExtractionResult | null>(null)

export const captureStore = {
  get state() { return state },
  get rawInput() { return rawInput },
  get extractedFields() { return extractedFields },

  setRawInput(text: string) { rawInput = text },

  async submitForExtraction(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    rawInput = trimmed
    state = 'extracting'
    extractedFields = null

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('EXTRACTION_CLIENT_TIMEOUT')), EXTRACTION_TIMEOUT_MS)
    })

    try {
      const result = await Promise.race([
        api.post('/api/extract', { text: trimmed }, ExtractionResponseSchema),
        timeoutPromise,
      ])

      if (result.ok) {
        extractedFields = result.data.data
        state = 'extracted'
      } else {
        state = 'manual'
      }
    } catch {
      state = 'manual'
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
    }
  },

  resetCapture() {
    state = 'idle'
    rawInput = ''
    extractedFields = null
  },
}
