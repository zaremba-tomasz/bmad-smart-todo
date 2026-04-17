import Fastify from 'fastify'

import { healthRoutes } from './routes/health.js'

const fastify = Fastify({
  logger: {
    level: 'info',
  },
})

fastify.register(healthRoutes)

const PORT = parseInt(process.env.PORT ?? '3001', 10)

fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`Server listening at ${address}`)
})
