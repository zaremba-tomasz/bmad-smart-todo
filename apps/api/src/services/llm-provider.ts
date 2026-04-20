import type { ExtractionResultSchema } from '@smart-todo/shared'
import type { z } from 'zod'

import { createLMStudioProvider } from './lm-studio.js'
import { createOpenRouterProvider } from './openrouter.js'

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>

export interface LLMProvider {
  extract(text: string): Promise<ExtractionResult>
}

export class ExtractionTimeoutError extends Error {
  constructor() {
    super('LLM extraction timed out')
    this.name = 'ExtractionTimeoutError'
  }
}

export class ExtractionProviderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExtractionProviderError'
  }
}

export const EXTRACTION_SYSTEM_PROMPT = `You are a task extraction assistant. Extract structured information from the user's natural language task description.

Extract the following fields:
- title: A clear, concise task title
- dueDate: Date in YYYY-MM-DD format, or null if no date mentioned
- dueTime: Time in HH:mm format (24-hour), or null if no time mentioned
- location: Location or place mentioned, or null if none
- priority: One of "low", "medium", "high", "urgent", or null if not mentioned
- recurrence: If the task repeats, extract pattern/interval/dayOfWeek/dayOfMonth, or null if not recurring

Return ONLY the JSON object. Do not include any explanation or text outside the JSON.`

export const EXTRACTION_TIMEOUT_MS = 4500

export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? 'openrouter'
  switch (provider) {
    case 'openrouter':
      return createOpenRouterProvider()
    case 'lmstudio':
      return createLMStudioProvider()
    default:
      throw new Error(`Unknown LLM provider: ${provider}`)
  }
}
