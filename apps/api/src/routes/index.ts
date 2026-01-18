import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { healthRoutes } from './health.js'
import { authRoutes } from './auth.js'
import { draftRoutes } from './drafts.js'
import { templateRoutes } from './templates.js'
import { complianceRoutes } from './compliance.js'
import { exportRoutes } from './exports.js'
import { aiRoutes } from './ai.js'

/**
 * Register all API routes
 */
export const registerRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Health check routes (no prefix, accessible at /health)
  await fastify.register(healthRoutes, { prefix: '/health' })

  // API v1 routes
  await fastify.register(
    async (api) => {
      // Authentication routes
      await api.register(authRoutes)

      // Draft routes
      await api.register(draftRoutes)

      // Template routes
      await api.register(templateRoutes)

      // Compliance routes
      await api.register(complianceRoutes)

      // Export routes
      await api.register(exportRoutes)

      // AI routes
      await api.register(aiRoutes)

      // API info endpoint
      api.get('/info', async () => {
        return {
          name: 'LexiGov AI API',
          version: '0.1.0',
          description: 'AI-powered ordinance drafting platform for Philippine LGUs',
          environment: process.env.NODE_ENV || 'development',
        }
      })
    },
    { prefix: '/api' }
  )

  // Root route
  fastify.get('/', async () => {
    return {
      message: 'Welcome to LexiGov AI API',
      version: '0.1.0',
      docs: '/api/info',
    }
  })
}
