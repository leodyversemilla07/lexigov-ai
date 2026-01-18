import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Health check endpoint
 */
export async function healthCheck(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '0.1.0',
  };
}

/**
 * API information endpoint
 */
export async function apiInfo(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return {
    name: 'LexiGov AI API',
    version: '0.1.0',
    description: 'AI-powered ordinance drafting platform for Philippine LGUs',
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      'GET /health',
      'GET /api/info',
      'GET /api/drafts',
      'POST /api/drafts',
      'PUT /api/drafts/:id',
      'DELETE /api/drafts/:id',
      'GET /api/templates',
      'POST /api/templates',
    ],
  };
}
