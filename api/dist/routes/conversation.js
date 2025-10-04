"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationRoutes = conversationRoutes;
const zod_1 = require("zod");
const database_1 = require("../lib/database");
const session_middleware_1 = require("../lib/session-middleware");
const websocket_1 = require("../lib/websocket");
const createConversationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    companyId: zod_1.z.string(),
    type: zod_1.z.enum(['DIRECT', 'GROUP']).optional().default('DIRECT'),
    participantIds: zod_1.z.array(zod_1.z.string()).optional(),
});
const updateConversationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
});
async function conversationRoutes(fastify) {
    // Criar conversa
    fastify.post('/', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { title, companyId, type, participantIds } = createConversationSchema.parse(request.body);
            // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
            const userId = request.user.id;
            // Verificar se o usuário pertence à empresa
            const membership = await database_1.prisma.companyMember.findFirst({
                where: {
                    companyId,
                    userId,
                },
            });
            if (!membership) {
                return reply.status(403).send({ error: 'Usuário não pertence à empresa' });
            }
            const conversation = await database_1.prisma.conversation.create({
                data: {
                    title,
                    companyId,
                    type,
                    createdById: userId,
                },
            });
            // Adicionar participantes
            const participants = [userId, ...(participantIds || [])];
            await database_1.prisma.conversationParticipant.createMany({
                data: participants.map(participantId => ({
                    conversationId: conversation.id,
                    userId: participantId,
                })),
            });
            // Notificar via WebSocket sobre nova conversa
            websocket_1.wsManager.notifyNewConversation(conversation.id, participants, companyId);
            return { conversation };
        }
        catch (error) {
            return reply.status(400).send({ error: 'Dados inválidos' });
        }
    });
    // Listar conversas do usuário
    fastify.get('/', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
            const userId = request.user.id;
            const { companyId } = request.query;
            const whereClause = {
                participants: {
                    some: {
                        userId,
                    },
                },
            };
            if (companyId) {
                whereClause.companyId = companyId;
            }
            const conversations = await database_1.prisma.conversation.findMany({
                where: whereClause,
                include: {
                    participants: {
                        include: {
                            user: true,
                        },
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            user: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });
            return { conversations };
        }
        catch (error) {
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
    // Obter conversa por ID
    fastify.get('/:id', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
            const userId = request.user.id;
            const conversation = await database_1.prisma.conversation.findFirst({
                where: {
                    id,
                    participants: {
                        some: {
                            userId,
                        },
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: true,
                        },
                    },
                    messages: {
                        include: {
                            user: true,
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            if (!conversation) {
                return reply.status(404).send({ error: 'Conversa não encontrada' });
            }
            return { conversation };
        }
        catch (error) {
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
    // Atualizar conversa
    fastify.put('/:id', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
            const userId = request.user.id;
            const updateData = updateConversationSchema.parse(request.body);
            // Verificar se o usuário é participante da conversa
            const participation = await database_1.prisma.conversationParticipant.findFirst({
                where: {
                    conversationId: id,
                    userId,
                },
            });
            if (!participation) {
                return reply.status(403).send({ error: 'Acesso negado' });
            }
            const conversation = await database_1.prisma.conversation.update({
                where: { id },
                data: updateData,
            });
            return { conversation };
        }
        catch (error) {
            return reply.status(400).send({ error: 'Dados inválidos' });
        }
    });
    // Adicionar participante à conversa
    fastify.post('/:id/participants', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { userId: participantId } = request.body;
            // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
            const currentUserId = request.user.id;
            // Verificar se o usuário atual é participante da conversa
            const participation = await database_1.prisma.conversationParticipant.findFirst({
                where: {
                    conversationId: id,
                    userId: currentUserId,
                },
            });
            if (!participation) {
                return reply.status(403).send({ error: 'Acesso negado' });
            }
            // Adicionar novo participante
            await database_1.prisma.conversationParticipant.create({
                data: {
                    conversationId: id,
                    userId: participantId,
                },
            });
            return { success: true };
        }
        catch (error) {
            return reply.status(400).send({ error: 'Dados inválidos' });
        }
    });
}
//# sourceMappingURL=conversation.js.map