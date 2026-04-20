import { ExtractionResultSchema } from '@smart-todo/shared'
import { zodToJsonSchema } from 'zod-to-json-schema'

import type { LLMProvider } from './llm-provider.js'
import {
  EXTRACTION_SYSTEM_PROMPT,
  EXTRACTION_TIMEOUT_MS,
  ExtractionProviderError,
  ExtractionTimeoutError,
} from './llm-provider.js'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const extractionJsonSchema = zodToJsonSchema(ExtractionResultSchema, {
  target: 'openApi3',
})

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError')
    || (typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError')
  )
}

export function createOpenRouterProvider(): LLMProvider {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new ExtractionProviderError('OPENROUTER_API_KEY is not configured')
  }

  const model = process.env.OPENROUTER_MODEL
  if (!model) {
    throw new ExtractionProviderError('OPENROUTER_MODEL is not configured')
  }

  return {
    async extract(text: string) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT_MS)

      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://smart-todo.app',
            'X-Title': 'Smart Todo',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
              { role: 'user', content: text },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'extraction_result',
                strict: true,
                schema: extractionJsonSchema,
              },
            },
            provider: {
              require_parameters: true,
              data_collection: 'deny',
            },
          }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new ExtractionProviderError(`Provider returned ${response.status}`)
        }

        const json = await response.json()
        const content = json.choices?.[0]?.message?.content
        if (!content) {
          throw new ExtractionProviderError('No content in provider response')
        }

        return JSON.parse(content)
      } catch (err) {
        clearTimeout(timeoutId)
        if (isAbortError(err)) {
          throw new ExtractionTimeoutError()
        }
        if (err instanceof ExtractionTimeoutError || err instanceof ExtractionProviderError) {
          throw err
        }
        throw new ExtractionProviderError(err instanceof Error ? err.message : 'Unknown error')
      }
    },
  }
}
