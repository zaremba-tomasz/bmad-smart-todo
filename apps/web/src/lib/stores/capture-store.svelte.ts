import { ExtractionResultSchema, ApiSuccessSchema } from '@smart-todo/shared'
import type { CreateTaskRequest } from '@smart-todo/shared'
import type { z } from 'zod'

import { api } from '$lib/api.js'
import { taskStore } from '$lib/stores/task-store.svelte.js'
import type { CaptureState } from '$lib/types/index.js'

const ExtractionResponseSchema = ApiSuccessSchema(ExtractionResultSchema)
type ExtractionResult = z.infer<typeof ExtractionResultSchema>

const EXTRACTION_TIMEOUT_MS = 5_000

let state = $state<CaptureState>('idle')
let rawInput = $state('')
let extractedFields = $state<ExtractionResult | null>(null)
let announcement = $state('')
let extractionRequestToken = 0
let saveInFlight = false

export const captureStore = {
  get state() { return state },
  get rawInput() { return rawInput },
  get extractedFields() { return extractedFields },
  get announcement() { return announcement },

  setRawInput(text: string) { rawInput = text },
  setAnnouncement(message: string) {
    // Force repeated screen-reader announcements for identical messages.
    announcement = ''
    queueMicrotask(() => { announcement = message })
  },

  async submitForExtraction(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    const requestToken = ++extractionRequestToken
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

      if (requestToken !== extractionRequestToken) return

      if (result.ok) {
        extractedFields = result.data.data
        state = 'extracted'
      } else {
        state = 'manual'
      }
    } catch {
      if (requestToken !== extractionRequestToken) return
      state = 'manual'
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
    }
  },

  updateField<K extends keyof ExtractionResult>(field: K, value: ExtractionResult[K]) {
    if (!extractedFields) return
    extractedFields = { ...extractedFields, [field]: value }
  },

  cancelExtraction() {
    extractionRequestToken += 1
    state = 'idle'
    extractedFields = null
  },

  saveTask() {
    if (saveInFlight) return false
    if (state !== 'extracted' && state !== 'manual') return false

    const fields = extractedFields
    if (!fields || !fields.title.trim()) return false

    state = 'saving'
    saveInFlight = true

    const input: CreateTaskRequest = {
      title: fields.title.trim(),
      dueDate: fields.dueDate,
      dueTime: fields.dueTime,
      location: fields.location,
      priority: fields.priority,
      groupId: null,
    }

    void taskStore.createTask(input)
      .catch(() => {
        // taskStore sets its own user-visible error state on failure.
      })
      .finally(() => {
        saveInFlight = false
      })

    state = 'idle'
    rawInput = ''
    extractedFields = null
    captureStore.setAnnouncement('Task saved')
    return true
  },

  resetCapture() {
    state = 'idle'
    rawInput = ''
    extractedFields = null
  },
}
