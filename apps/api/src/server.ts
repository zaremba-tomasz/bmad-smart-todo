import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'

import { authMiddleware } from './middleware/auth.js'
import { extractRoutes } from './routes/extract.js'
import { healthRoutes } from './routes/health.js'
import { taskRoutes } from './routes/tasks.js'

export function buildServer(): FastifyInstance {
  const fastify = Fastify({
    logger: {
      level: 'info',
    },
  })

  fastify.addHook('onRequest', async (request, reply) => {
    const routePath = request.url

    if (!routePath.startsWith('/api/') || routePath === '/api/health') {
      return
    }

    return authMiddleware(request, reply)
  })

  fastify.register(rateLimit, {
    global: false,
    keyGenerator: (request) => request.userId,
    hook: 'preHandler',
    errorResponseBuilder: (_request, context) => ({
      statusCode: context.statusCode,
      error: { code: 'RATE_LIMITED', message: 'Too many extraction requests. Try again later.' },
    }),
  })

  fastify.register(healthRoutes)
  fastify.register(taskRoutes)
  fastify.register(extractRoutes)

  return fastify
}

const fastify = buildServer()

const PORT = parseInt(process.env.PORT ?? '3001', 10)

if (process.env.VITEST !== 'true') {
  fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    fastify.log.info(`Server listening at ${address}`)
  })
}
