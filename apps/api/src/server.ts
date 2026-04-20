import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'

import { authMiddleware } from './middleware/auth.js'
import { healthRoutes } from './routes/health.js'
import { taskRoutes } from './routes/tasks.js'

export function buildServer(): FastifyInstance {
  const fastify = Fastify({
    logger: {
      level: 'info',
    },
  })

  fastify.addHook('preHandler', async (request, reply) => {
    const routePath = request.routeOptions.url ?? request.url

    if (!routePath.startsWith('/api/') || routePath === '/api/health') {
      return
    }

    return authMiddleware(request, reply)
  })

  fastify.register(healthRoutes)
  fastify.register(taskRoutes)

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
