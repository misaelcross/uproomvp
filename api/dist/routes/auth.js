"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const database_1 = require("../lib/database");
const auth_service_1 = require("../lib/auth-service");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
async function authRoutes(fastify) {
    // Login otimizado
    fastify.post('/signin', (0, errors_1.withErrorHandling)(async (request, reply) => {
        const { email, password } = (0, validation_1.validateData)(validation_1.signInSchema, request.body);
        const result = await auth_service_1.AuthService.signIn(email, password);
        if (!result.success) {
            throw new errors_1.AuthenticationError(result.error || 'Falha na autenticação');
        }
        if (!result.user || !result.token) {
            throw new errors_1.AuthenticationError('Falha na autenticação');
        }
        return {
            user: result.user,
            session: {
                access_token: result.token,
                refresh_token: '', // We'll handle this if needed
                expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
                user: result.user
            },
        };
    }));
    // Registro otimizado
    fastify.post('/signup', (0, errors_1.withErrorHandling)(async (request, reply) => {
        console.log('🔍 [SIGNUP] Recebendo requisição de signup:', {
            headers: request.headers,
            body: request.body
        });
        const { email, password, fullName } = (0, validation_1.validateData)(validation_1.signUpSchema, request.body);
        console.log('🔍 [SIGNUP] Dados validados:', { email, fullName });
        const result = await auth_service_1.AuthService.signUp(email, password, fullName);
        console.log('🔍 [SIGNUP] Resultado do AuthService:', result);
        if (!result.success) {
            console.error('❌ [SIGNUP] Erro no AuthService:', result.error);
            throw new errors_1.AuthenticationError(result.error || 'Falha ao criar usuário');
        }
        if (!result.user || !result.token) {
            console.error('❌ [SIGNUP] Usuário ou token não encontrado');
            throw new errors_1.AuthenticationError('Falha ao criar usuário');
        }
        console.log('✅ [SIGNUP] Usuário criado com sucesso:', result.user.email);
        return {
            user: result.user,
            session: {
                access_token: result.token,
                refresh_token: '', // We'll handle this if needed
                expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
                user: result.user
            },
            requiresConfirmation: false,
            message: 'Conta criada com sucesso',
        };
    }));
    // Logout otimizado
    fastify.post('/signout', (0, errors_1.withErrorHandling)(async (request, reply) => {
        // With JWT, logout is handled on the client side by removing the token
        // No server-side action needed for stateless JWT
        return { message: 'Logout realizado com sucesso' };
    }));
    // Reset de senha otimizado
    fastify.post('/reset-password', (0, errors_1.withErrorHandling)(async (request, reply) => {
        const { email } = (0, validation_1.validateData)(validation_1.resetPasswordSchema, request.body);
        const result = await auth_service_1.AuthService.resetPassword(email);
        if (!result.success) {
            throw new errors_1.AuthenticationError(result.error || 'Falha ao enviar email de recuperação');
        }
        return { message: 'Email de recuperação enviado' };
    }));
    // Atualizar senha otimizado
    fastify.post('/update-password', (0, errors_1.withErrorHandling)(async (request, reply) => {
        const { password } = (0, validation_1.validateData)(validation_1.updatePasswordSchema, request.body);
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new errors_1.AuthenticationError('Token não fornecido');
        }
        const token = authHeader.replace('Bearer ', '');
        const decoded = auth_service_1.AuthService.verifyToken(token);
        if (!decoded) {
            throw new errors_1.AuthenticationError('Token inválido');
        }
        const result = await auth_service_1.AuthService.updatePassword(decoded.userId, password);
        if (!result.success) {
            throw new errors_1.AuthenticationError(result.error || 'Falha ao atualizar senha');
        }
        return { message: 'Senha atualizada com sucesso' };
    }));
    // Obter perfil do usuário otimizado
    fastify.get('/profile', (0, errors_1.withErrorHandling)(async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new errors_1.AuthenticationError('Token não fornecido');
        }
        const token = authHeader.replace('Bearer ', '');
        // Verificar token JWT
        const decoded = auth_service_1.AuthService.verifyToken(token);
        if (!decoded) {
            throw new errors_1.AuthenticationError('Token inválido');
        }
        // Buscar dados do usuário no banco local
        const dbUser = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!dbUser) {
            return reply.status(404).send({ error: 'Usuário não encontrado' });
        }
        return {
            user: {
                id: dbUser.id,
                email: dbUser.email,
                fullName: dbUser.fullName,
                avatar: dbUser.avatar,
                createdAt: dbUser.createdAt,
            },
        };
    }));
    // Verificar sessão otimizado
    fastify.get('/session', (0, errors_1.withErrorHandling)(async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new errors_1.AuthenticationError('Token não fornecido');
        }
        const token = authHeader.replace('Bearer ', '');
        const decoded = auth_service_1.AuthService.verifyToken(token);
        if (!decoded) {
            throw new errors_1.AuthenticationError('Token inválido');
        }
        const user = await auth_service_1.AuthService.getUserByToken(token);
        if (!user) {
            throw new errors_1.AuthenticationError('Usuário não encontrado');
        }
        return {
            session: {
                access_token: token,
                refresh_token: '',
                expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000),
                user: user
            }
        };
    }));
}
//# sourceMappingURL=auth.js.map