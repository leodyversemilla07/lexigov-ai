import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Health check routes plugin
 */
export const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Health check endpoint
  fastify.get(
    '/',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
              version: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '0.1.0',
      }
    }
  )

  // Readiness check endpoint
  fastify.get(
    '/ready',
    {
      schema: {
        description: 'Readiness check endpoint',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              ready: { type: 'boolean' },
            },
          },
        },
      },
    },
    async () => {
      // Add any readiness checks here (database connections, etc.)
      return { ready: true }
    }
  )

  // Liveness check endpoint
  fastify.get(
    '/live',
    {
      schema: {
        description: 'Liveness check endpoint',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              alive: { type: 'boolean' },
            },
          },
        },
      },
    },
    async () => {
      return { alive: true }
    }
  )
}

