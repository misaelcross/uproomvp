"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = userRoutes;
const database_1 = require("../lib/database");
const session_middleware_1 = require("../lib/session-middleware");
async function userRoutes(fastify) {
    // Obter perfil do usuário
    fastify.get('/profile', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
            const userId = request.user.id;
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    companyMemberships: {
                        include: {
                            company: true,
                        },
                    },
                },
            });
            if (!user) {
                return reply.status(404).send({ error: 'Usuário não encontrado' });
            }
            return { user };
        }
        catch (error) {
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
    // Listar usuários de uma empresa
    fastify.get('/company/:companyId', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { companyId } = request.params;
            // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
            const userId = request.user.id;
            // Verificar se o usuário é membro da empresa
            const membership = await database_1.prisma.companyMember.findFirst({
                where: {
                    companyId,
                    userId,
                },
            });
            if (!membership) {
                return reply.status(403).send({ error: 'Acesso negado' });
            }
            const members = await database_1.prisma.companyMember.findMany({
                where: { companyId },
                include: {
                    user: true,
                },
                orderBy: { createdAt: 'asc' },
            });
            return { members };
        }
        catch (error) {
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
    // Buscar usuários por email
    fastify.get('/search', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { email, companyId } = request.query;
            if (!email) {
                return reply.status(400).send({ error: 'Email é obrigatório' });
            }
            const users = await database_1.prisma.user.findMany({
                where: {
                    email: {
                        contains: email,
                    },
                },
                take: 10,
            });
            // Se companyId foi fornecido, filtrar usuários que não são membros
            if (companyId) {
                const companyMembers = await database_1.prisma.companyMember.findMany({
                    where: { companyId },
                    select: { userId: true },
                });
                const memberIds = companyMembers.map(m => m.userId);
                const filteredUsers = users.filter(user => !memberIds.includes(user.id));
                return { users: filteredUsers };
            }
            return { users };
        }
        catch (error) {
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
    // Atualizar perfil do usuário
    fastify.put('/profile', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
            const userId = request.user.id;
            const { name, email } = request.body;
            const user = await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(name && { name }),
                    ...(email && { email }),
                },
            });
            return { user };
        }
        catch (error) {
            return reply.status(400).send({ error: 'Dados inválidos' });
        }
    });
}
//# sourceMappingURL=user.js.map