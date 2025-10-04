import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './lib/config';
import { prisma, disconnectDatabase, checkDatabaseHealth } from './lib/database';
import { handleError } from './lib/errors';
import { authRoutes } from './routes/auth';
import { companyRoutes } from './routes/company';
import { conversationRoutes } from './routes/conversation';
import { messageRoutes } from './routes/message';
import { invitationRoutes } from './routes/invitation';
import { userRoutes } from './routes/user';
import { presenceRoutes } from './routes/presence';
import { wsManager } from './lib/websocket';

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'warn' : 'info',
    transport: config.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      }
    } : undefined,
  },
  disableRequestLogging: config.NODE_ENV === 'production',
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
    host: config.NODE_ENV === 'production' ? 'api.uproom.com' : 'localhost:3333',
    schemes: config.NODE_ENV === 'production' ? ['https'] : ['http'],
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
// Configuração otimizada do CORS
const getCorsOrigins = () => {
  if (config.CORS_ORIGIN) {
    return config.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    // Domínios principais
    'https://starvibe.space',
    'https://uproom.com',
    'https://uproomvp.vercel.app',
  ];

  const regexOrigins = [
    // Subdomínios de workspaces em produção
    /^https:\/\/[a-zA-Z0-9-]+\.starvibe\.space$/,
    /^https:\/\/[a-zA-Z0-9-]+\.uproom\.com$/,
    /^https:\/\/[a-zA-Z0-9-]+\.uproomvp\.vercel\.app$/,
    // Subdomínios de workspaces em dev local
    /^http:\/\/[a-zA-Z0-9-]+\.localhost:3000$/,
    /^http:\/\/[a-zA-Z0-9-]+\.localhost:5173$/,
    /^http:\/\/[a-zA-Z0-9-]+\.127\.0\.0\.1:3000$/,
    /^http:\/\/[a-zA-Z0-9-]+\.127\.0\.0\.1:5173$/
  ];

  return [...defaultOrigins, ...regexOrigins];
};

fastify.register(cors, {
  origin: (origin, callback) => {
    console.log('🔍 [CORS] Checking origin:', origin);
    const allowedOrigins = getCorsOrigins();
    
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      console.log('✅ [CORS] Allowing request with no origin');
      callback(null, true);
      return;
    }
    
    // Check if origin is in allowedOrigins
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ [CORS] Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ [CORS] Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
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
    'X-Supabase-Auth',
    'X-Workspace-Subdomain'
  ]
});

fastify.register(rateLimit, {
  max: config.RATE_LIMIT_MAX,
  timeWindow: config.RATE_LIMIT_TIME_WINDOW,
  errorResponseBuilder: (request, context) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: `Rate limit exceeded, retry in ${context.after}`
  })
});

// Register routes
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(companyRoutes, { prefix: '/companies' });
fastify.register(conversationRoutes, { prefix: '/conversations' });
fastify.register(messageRoutes, { prefix: '/messages' });
fastify.register(invitationRoutes, { prefix: '/invitations' });
fastify.register(userRoutes, { prefix: '/users' });
fastify.register(presenceRoutes, { prefix: '/presence' });

// Health check otimizado
fastify.get('/health', async (request, reply) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        api: 'healthy'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  } catch (error) {
    return reply.status(503).send({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unhealthy',
        api: 'healthy'
      }
    });
  }
});

// Swagger JSON endpoint
fastify.get('/swagger.json', async () => {
  return fastify.swagger();
});

// Graceful shutdown otimizado
const gracefulShutdown = async (signal: string) => {
  console.log(`🔄 Recebido sinal ${signal}, iniciando shutdown graceful...`);
  
  try {
    // Parar de aceitar novas conexões
    await fastify.close();
    console.log('✅ Servidor HTTP encerrado');
    
    // Desconectar do banco de dados
    await disconnectDatabase();
    
    console.log('✅ Shutdown concluído com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante shutdown:', error);
    process.exit(1);
  }
};

// Registrar handlers de shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handler para erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Inicialização otimizada
const start = async () => {
  try {
    console.log('🚀 Iniciando servidor UpRoom API...');
    
    // Verificar saúde do banco antes de iniciar
    const dbHealth = await checkDatabaseHealth();
    if (!dbHealth) {
      throw new Error('❌ Banco de dados não está acessível');
    }
    
    await fastify.listen({ 
      port: config.PORT, 
      host: '0.0.0.0' 
    });
    
    // Inicializar WebSocket
    wsManager.initialize(fastify);
    console.log('🔌 WebSocket server inicializado');
    
    console.log(`✅ Servidor rodando em http://localhost:${config.PORT}`);
    console.log(`📚 Documentação disponível em http://localhost:${config.PORT}/docs`);
    console.log(`🏥 Health check em http://localhost:${config.PORT}/health`);
    
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err);
    process.exit(1);
  }
};

start();
