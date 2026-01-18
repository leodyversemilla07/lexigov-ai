import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { healthCheck, apiInfo } from './routes/health';
import { authRoutes } from './routes/auth';
import { draftRoutes } from './routes/drafts';
import { templateRoutes } from './routes/templates';
import { complianceRoutes } from './routes/compliance';
import { exportRoutes } from './routes/exports';
import { aiRoutes } from './routes/ai';

/**
 * Register all API routes
 */
export default async function routes(
  server: FastifyInstance,
  options: {
    prefix: '/api/v1',
  }
) {
  // Health check
  server.get('/health', healthCheck);
  server.get('/info', apiInfo);

  // Authentication routes
  await authRoutes(server);

  // Draft routes
  await draftRoutes(server);

  // Template routes
  await templateRoutes(server);

  // Compliance routes
  await complianceRoutes(server);

  // Export routes
  await exportRoutes(server);

  // AI routes
  await aiRoutes(server);

  // Placeholder routes (will be implemented)
  server.get('/', async (request, reply) => {
    return {
      message: 'Welcome to LexiGov AI API',
      version: '0.1.0',
      docs: '/api/v1/docs',
    };
  });
}
