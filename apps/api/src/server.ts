import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';

// Fastify v5 logger configuration
const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

// Register plugins
server.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
});

server.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
});

server.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  sign: {
    expiresIn: '7d',
  },
});

// Root endpoint
server.get('/', async () => {
  return {
    name: 'LexiGov AI API',
    version: '0.1.0',
    description: 'AI-powered ordinance and policy drafting platform for Philippine LGUs',
    documentation: '/api/info',
    health: '/health',
  };
});

// Health check endpoint
server.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

// API info endpoint
server.get('/api/info', async () => {
  return {
    name: 'LexiGov AI API',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      'GET /health',
      'GET /api/info',
      'GET /api/drafts',
      'POST /api/drafts',
      'PUT /api/drafts/:id',
      'DELETE /api/drafts/:id',
      'GET /api/templates',
    ],
  };
});

// Test API endpoint (for development)
server.get('/api/test', async () => {
  return {
    message: 'API is working',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured',
    timestamp: new Date().toISOString(),
  };
});

// Routes will be registered here in separate files
server.register(async (fastify) => {
  fastify.log.info('LexiGov AI API server starting...');
});

const start = async () => {
  try {
    await server.listen({
      port: parseInt(process.env.PORT || '8080'),
      host: process.env.HOST || '0.0.0.0',
    });
    server.log.info(`🚀 Server listening on http://${process.env.HOST || '0.0.0.0'}:${process.env.PORT || '8080'}`);
  } catch (err) {
    server.log.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  server.log.info('🛑 Shutting down gracefully...');
  await server.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
