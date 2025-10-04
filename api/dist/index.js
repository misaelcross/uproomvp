"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const config_1 = require("./lib/config");
const database_1 = require("./lib/database");
const auth_1 = require("./routes/auth");
const company_1 = require("./routes/company");
const conversation_1 = require("./routes/conversation");
const message_1 = require("./routes/message");
const invitation_1 = require("./routes/invitation");
const user_1 = require("./routes/user");
const presence_1 = require("./routes/presence");
const websocket_1 = require("./lib/websocket");
const fastify = (0, fastify_1.default)({
    logger: {
        level: config_1.config.NODE_ENV === 'production' ? 'warn' : 'info',
        transport: config_1.config.NODE_ENV === 'development' ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            }
        } : undefined,
    },
    disableRequestLogging: config_1.config.NODE_ENV === 'production',
});
// Swagger configuration
fastify.register(swagger_1.default, {
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
        host: config_1.config.NODE_ENV === 'production' ? 'api.uproom.com' : 'localhost:3333',
        schemes: config_1.config.NODE_ENV === 'production' ? ['https'] : ['http'],
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
fastify.register(swagger_ui_1.default, {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: true
    },
    uiHooks: {
        onRequest: function (request, reply, next) { next(); },
        preHandler: function (request, reply, next) { next(); }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => { return swaggerObject; },
    transformSpecificationClone: true
});
// Configuração otimizada do CORS
const getCorsOrigins = () => {
    if (config_1.config.CORS_ORIGIN) {
        return config_1.config.CORS_ORIGIN.split(',').map(origin => origin.trim());
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
fastify.register(cors_1.default, {
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
            }
            else if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        });
        if (isAllowed) {
            console.log('✅ [CORS] Origin allowed:', origin);
            callback(null, true);
        }
        else {
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
fastify.register(rate_limit_1.default, {
    max: config_1.config.RATE_LIMIT_MAX,
    timeWindow: config_1.config.RATE_LIMIT_TIME_WINDOW,
    errorResponseBuilder: (request, context) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.after}`
    })
});
// Register routes
fastify.register(auth_1.authRoutes, { prefix: '/auth' });
fastify.register(company_1.companyRoutes, { prefix: '/companies' });
fastify.register(conversation_1.conversationRoutes, { prefix: '/conversations' });
fastify.register(message_1.messageRoutes, { prefix: '/messages' });
fastify.register(invitation_1.invitationRoutes, { prefix: '/invitations' });
fastify.register(user_1.userRoutes, { prefix: '/users' });
fastify.register(presence_1.presenceRoutes, { prefix: '/presence' });
// Health check otimizado
fastify.get('/health', async (request, reply) => {
    try {
        const dbHealth = await (0, database_1.checkDatabaseHealth)();
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
    }
    catch (error) {
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
const gracefulShutdown = async (signal) => {
    console.log(`🔄 Recebido sinal ${signal}, iniciando shutdown graceful...`);
    try {
        // Parar de aceitar novas conexões
        await fastify.close();
        console.log('✅ Servidor HTTP encerrado');
        // Desconectar do banco de dados
        await (0, database_1.disconnectDatabase)();
        console.log('✅ Shutdown concluído com sucesso');
        process.exit(0);
    }
    catch (error) {
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
        const dbHealth = await (0, database_1.checkDatabaseHealth)();
        if (!dbHealth) {
            throw new Error('❌ Banco de dados não está acessível');
        }
        await fastify.listen({
            port: config_1.config.PORT,
            host: '0.0.0.0'
        });
        // Inicializar WebSocket
        websocket_1.wsManager.initialize(fastify);
        console.log('🔌 WebSocket server inicializado');
        console.log(`✅ Servidor rodando em http://localhost:${config_1.config.PORT}`);
        console.log(`📚 Documentação disponível em http://localhost:${config_1.config.PORT}/docs`);
        console.log(`🏥 Health check em http://localhost:${config_1.config.PORT}/health`);
    }
    catch (err) {
        console.error('❌ Erro ao iniciar servidor:', err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map