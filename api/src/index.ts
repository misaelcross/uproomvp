import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';
import { companyRoutes } from './routes/company';
import { conversationRoutes } from './routes/conversation';
import { messageRoutes } from './routes/message';
import { invitationRoutes } from './routes/invitation';
import { userRoutes } from './routes/user';

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
    }
  },
});

// Swagger configuration
fastify.register(swagger, {
  swagger: {
    info: {
      title: 'UpRoom API',
      description: 'API para o sistema UpRoom - Plataforma de comunicação empresarial',
      version: '1.0.0',
      contact: {
        name: 'UpRoom Team',
        email: 'support@uproom.com'
      }
    },
    host: process.env.NODE_ENV === 'production' ? 'api.uproom.com' : 'localhost:3333',
    schemes: process.env.NODE_ENV === 'production' ? ['https'] : ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'auth', description: 'Autenticação' },
      { name: 'companies', description: 'Empresas' },
      { name: 'conversations', description: 'Conversas' },
      { name: 'messages', description: 'Mensagens' },
      { name: 'invitations', description: 'Convites' },
      { name: 'users', description: 'Usuários' }
    ],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'Token de autenticação no formato: Bearer {token}'
      }
    }
  }
});

fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true
  },
  uiHooks: {
    onRequest: function (request, reply, next) { next() },
    preHandler: function (request, reply, next) { next() }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
  transformSpecificationClone: true
});
// Configuração do CORS usando variáveis de ambiente
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'http://localhost:8080',
      'http://localhost:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5173',
      'https://uproom.com',
      'http://uproom.com',
      // Subdomínios locais para desenvolvimento
      /^http:\/\/[a-zA-Z0-9-]+\.localhost:8080$/,
      /^http:\/\/[a-zA-Z0-9-]+\.localhost:5173$/,
      /^http:\/\/[a-zA-Z0-9-]+\.127\.0\.0\.1:8080$/,
      /^http:\/\/[a-zA-Z0-9-]+\.127\.0\.0\.1:5173$/,
      // Subdomínios de produção
      /^https:\/\/[a-zA-Z0-9-]+\.uproom\.com$/,
      /^http:\/\/[a-zA-Z0-9-]+\.uproom\.com$/
    ];

fastify.register(cors, {
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Client-Info',
    'apikey',
    'X-Supabase-Auth'
  ]
});
fastify.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  timeWindow: process.env.RATE_LIMIT_TIME_WINDOW || '1 minute',
});

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(companyRoutes, { prefix: '/api/companies' });
fastify.register(conversationRoutes, { prefix: '/api/conversations' });
fastify.register(messageRoutes, { prefix: '/api/messages' });
fastify.register(invitationRoutes, { prefix: '/api/invitations' });
fastify.register(userRoutes, { prefix: '/api/users' });

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Swagger JSON endpoint
fastify.get('/swagger.json', async () => {
  return fastify.swagger();
});

// Graceful shutdown
const gracefulShutdown = async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3333');
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
