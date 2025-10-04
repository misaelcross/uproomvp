"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presenceRoutes = presenceRoutes;
const zod_1 = require("zod");
const database_1 = require("../lib/database");
const session_middleware_1 = require("../lib/session-middleware");
const updatePresenceSchema = zod_1.z.object({
    status: zod_1.z.enum(['AVAILABLE', 'BUSY', 'AWAY', 'OFFLINE']),
    message: zod_1.z.string().optional(),
    isOnline: zod_1.z.boolean().optional(),
});
async function presenceRoutes(fastify) {
    // Get user presence for a company
    fastify.get('/:companyId', {
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
            const presence = await database_1.prisma.userPresence.findUnique({
                where: {
                    userId_companyId: {
                        userId,
                        companyId,
                    },
                },
            });
            if (!presence) {
                // Create default presence if none exists
                const defaultPresence = await database_1.prisma.userPresence.create({
                    data: {
                        userId,
                        companyId,
                        status: 'OFFLINE',
                        message: 'Finished for today',
                        isOnline: false,
                    },
                });
                return { presence: defaultPresence };
            }
            return { presence };
        }
        catch (error) {
            console.error('Error getting user presence:', error);
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
    // Update user presence
    fastify.put('/:companyId', {
        preHandler: session_middleware_1.requireAuth,
        schema: {
            body: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: {
                        type: 'string',
                        enum: ['AVAILABLE', 'BUSY', 'AWAY', 'OFFLINE']
                    },
                    message: {
                        type: 'string'
                    },
                    isOnline: {
                        type: 'boolean'
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { companyId } = request.params;
            // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
            const userId = request.user.id;
            const updateData = updatePresenceSchema.parse(request.body);
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
            const presence = await database_1.prisma.userPresence.upsert({
                where: {
                    userId_companyId: {
                        userId,
                        companyId,
                    },
                },
                update: {
                    ...updateData,
                    lastSeen: new Date(),
                },
                create: {
                    userId,
                    companyId,
                    ...updateData,
                    lastSeen: new Date(),
                },
            });
            return { presence };
        }
        catch (error) {
            console.error('Error updating user presence:', error);
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
    // Get all company members presence
    fastify.get('/:companyId/members', {
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
            const presences = await database_1.prisma.userPresence.findMany({
                where: { companyId },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
                orderBy: {
                    lastSeen: 'desc',
                },
            });
            return { presences };
        }
        catch (error) {
            console.error('Error getting company presences:', error);
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
}
//# sourceMappingURL=presence.js.map