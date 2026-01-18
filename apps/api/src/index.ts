import Fastify from 'fastify'
import { registerPlugins } from './plugins/index.js'
import { registerRoutes } from './routes/index.js'
import { initializeFirebaseAdmin } from './lib/firebase-admin.js'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
})

// Initialize Firebase Admin SDK
try {
  initializeFirebaseAdmin()
  fastify.log.info('Firebase Admin SDK initialized')
} catch (error) {
  fastify.log.warn('Firebase Admin SDK not initialized - authentication will not work')
  fastify.log.warn('Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY environment variable')
}

// Register plugins
await registerPlugins(fastify)

// Register routes
await fastify.register(registerRoutes)

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, shutting down gracefully...`)
    await fastify.close()
    process.exit(0)
  })
})

// Start server
const start = async () => {
  try {
    const host = process.env.HOST || '0.0.0.0'
    const port = Number(process.env.PORT) || 3001

    await fastify.listen({ port, host })
    fastify.log.info(`Server is running at http://${host}:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
