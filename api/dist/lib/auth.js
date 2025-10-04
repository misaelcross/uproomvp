"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const database_1 = require("./database");
const auth_service_1 = require("./auth-service");
const authHeaderSchema = zod_1.z.object({
    authorization: zod_1.z.string().regex(/^Bearer .+$/),
});
const authenticateUser = async (request, reply) => {
    try {
        console.log('🔍 Auth: Verificando autenticação para:', request.url);
        console.log('🔍 Auth: Headers:', request.headers.authorization ? 'Authorization presente' : 'Sem Authorization');
        const { authorization } = authHeaderSchema.parse(request.headers);
        const token = authorization.replace('Bearer ', '');
        console.log('🔍 Auth: Token recebido:', token.substring(0, 20) + '...');
        // Verificar token JWT
        const decoded = auth_service_1.AuthService.verifyToken(token);
        if (!decoded) {
            console.log('Token inválido ou expirado');
            return reply.status(401).send({ error: 'Token inválido' });
        }
        // Buscar dados do usuário no banco local
        const dbUser = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!dbUser) {
            console.log('Usuário não encontrado no banco local:', decoded.userId);
            return reply.status(404).send({ error: 'Usuário não encontrado' });
        }
        console.log('Usuário autenticado:', { id: dbUser.id, email: dbUser.email });
        request.user = {
            id: dbUser.id,
            email: dbUser.email,
        };
    }
    catch (error) {
        console.error('❌ Auth: Erro de autenticação:', error);
        console.error('❌ Auth: URL:', request.url);
        console.error('❌ Auth: Headers:', request.headers);
        if (error instanceof zod_1.z.ZodError) {
            console.error('❌ Auth: Erro de validação do header:', error.errors);
            return reply.status(401).send({ error: 'Header de autorização inválido' });
        }
        return reply.status(401).send({ error: 'Token de autenticação inválido' });
    }
};
exports.authenticateUser = authenticateUser;
//# sourceMappingURL=auth.js.map