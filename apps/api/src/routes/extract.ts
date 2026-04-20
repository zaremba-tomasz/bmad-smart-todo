import {
  ErrorCode,
  ExtractionResultSchema,
  ExtractRequestSchema,
} from '@smart-todo/shared'
import type { FastifyInstance } from 'fastify'

import {
  createLLMProvider,
  ExtractionTimeoutError,
} from '../services/llm-provider.js'

export async function extractRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/extract',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const parsed = ExtractRequestSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: ErrorCode.enum.VALIDATION_ERROR,
            message: parsed.error.issues[0]?.message ?? 'Invalid request body',
          },
        })
      }

      const startTime = Date.now()
      const providerName = process.env.LLM_PROVIDER ?? 'openrouter'
      const model = providerName === 'lmstudio'
        ? 'local-model'
        : (process.env.OPENROUTER_MODEL ?? 'unknown')

      let provider
      try {
        provider = createLLMProvider()
      } catch {
        const durationMs = Date.now() - startTime
        request.log.info({
          event: 'extraction',
          status: 'provider_error',
          duration_ms: durationMs,
          model,
          provider: providerName,
        })
        return reply.status(502).send({
          error: {
            code: ErrorCode.enum.EXTRACTION_PROVIDER_ERROR,
            message: 'LLM provider error',
          },
        })
      }

      try {
        const result = await provider.extract(parsed.data.text)

        const validated = ExtractionResultSchema.safeParse(result)
        if (!validated.success) {
          const durationMs = Date.now() - startTime
          request.log.info({
            event: 'extraction',
            status: 'validation_failed',
            duration_ms: durationMs,
            model,
            provider: providerName,
          })
          return reply.status(422).send({
            error: {
              code: ErrorCode.enum.EXTRACTION_VALIDATION_FAILED,
              message: 'LLM response did not match expected schema',
            },
          })
        }

        const durationMs = Date.now() - startTime
        request.log.info({
          event: 'extraction',
          status: 'success',
          duration_ms: durationMs,
          model,
          provider: providerName,
        })
        return reply.send({ data: validated.data })
      } catch (err) {
        const durationMs = Date.now() - startTime
        if (err instanceof ExtractionTimeoutError) {
          request.log.info({
            event: 'extraction',
            status: 'timeout',
            duration_ms: durationMs,
            model,
            provider: providerName,
          })
          return reply.status(408).send({
            error: {
              code: ErrorCode.enum.EXTRACTION_TIMEOUT,
              message: 'LLM extraction timed out',
            },
          })
        }
        request.log.info({
          event: 'extraction',
          status: 'provider_error',
          duration_ms: durationMs,
          model,
          provider: providerName,
        })
        return reply.status(502).send({
          error: {
            code: ErrorCode.enum.EXTRACTION_PROVIDER_ERROR,
            message: 'LLM provider error',
          },
        })
      }
    },
  )
}
