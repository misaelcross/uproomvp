import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { requireAuth } from '../lib/session-middleware';
import { wsManager } from '../lib/websocket';

const createConversationSchema = z.object({
  title: z.string().min(1),
  companyId: z.string(),
  type: z.enum(['DIRECT', 'GROUP']).optional().default('DIRECT'),
  participantIds: z.array(z.string()).optional(),
});

const updateConversationSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
});

export async function conversationRoutes(fastify: FastifyInstance) {
  // Criar conversa
  fastify.post('/', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { title, companyId, type, participantIds } = createConversationSchema.parse(request.body);
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      // Verificar se o usuário pertence à empresa
      const membership = await prisma.companyMember.findFirst({
        where: {
          companyId,
          userId,
        },
      });

      if (!membership) {
        return reply.status(403).send({ error: 'Usuário não pertence à empresa' });
      }

      const conversation = await prisma.conversation.create({
        data: {
          title,
          companyId,
          type,
          createdById: userId,
        },
      });

      // Adicionar participantes
      const participants = [userId, ...(participantIds || [])];
      await prisma.conversationParticipant.createMany({
        data: participants.map(participantId => ({
          conversationId: conversation.id,
          userId: participantId,
        })),
      });

      // Notificar via WebSocket sobre nova conversa
      wsManager.notifyNewConversation(conversation.id, participants, companyId);

      return { conversation };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });

  // Listar conversas do usuário
  fastify.get('/', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;
      const { companyId, archived } = request.query as { companyId?: string; archived?: string };

      // Se archived=true, mostrar apenas arquivadas; caso contrário, apenas não-arquivadas
      const isArchived = archived === 'true';

      const whereClause: any = {
        participants: {
          some: {
            userId,
            isArchived: isArchived,
          },
        },
      };

      if (companyId) {
        whereClause.companyId = companyId;
      }

      const conversations = await prisma.conversation.findMany({
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
    } catch (error) {
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Obter conversa por ID
  fastify.get('/:id', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      const conversation = await prisma.conversation.findFirst({
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
    } catch (error) {
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Atualizar conversa
  fastify.put('/:id', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;
      const updateData = updateConversationSchema.parse(request.body);

      // Verificar se o usuário é participante da conversa
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: id,
          userId,
        },
      });

      if (!participation) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }

      const conversation = await prisma.conversation.update({
        where: { id },
        data: updateData,
      });

      return { conversation };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });

  // Adicionar participante à conversa
  fastify.post('/:id/participants', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { userId: participantId } = request.body as { userId: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const currentUserId = request.user.id;

      // Verificar se o usuário atual é participante da conversa
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: id,
          userId: currentUserId,
        },
      });

      if (!participation) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }

      // Adicionar novo participante
      await prisma.conversationParticipant.create({
        data: {
          conversationId: id,
          userId: participantId,
        },
      });

      return { success: true };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });

  // Remover participante da conversa
  fastify.delete('/:id/participants/:userId', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id, userId } = request.params as { id: string; userId: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const currentUserId = request.user.id;

      // Verificar se o usuário atual é participante da conversa
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: id,
          userId: currentUserId,
        },
      });

      if (!participation) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }

      // Remover participante
      await prisma.conversationParticipant.deleteMany({
        where: {
          conversationId: id,
          userId: userId,
        },
      });

      return { success: true };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });

  // Deletar conversa
  fastify.delete('/:id', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      // Verificar se o usuário é criador ou participante da conversa
      const conversation = await prisma.conversation.findFirst({
        where: {
          id,
          participants: {
            some: {
              userId,
            },
          },
        },
      });

      if (!conversation) {
        return reply.status(404).send({ error: 'Conversa não encontrada' });
      }

      // Deletar todos os participantes
      await prisma.conversationParticipant.deleteMany({
        where: { conversationId: id },
      });

      // Deletar todas as mensagens
      await prisma.message.deleteMany({
        where: { conversationId: id },
      });

      // Deletar a conversa
      await prisma.conversation.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Arquivar conversa
  fastify.post('/:id/archive', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      // Verificar se o usuário é participante da conversa
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: id,
          userId,
        },
      });

      if (!participation) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }

      // Atualizar o participante para arquivar a conversa
      await prisma.conversationParticipant.update({
        where: {
          id: participation.id,
        },
        data: {
          isArchived: true,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao arquivar conversa:', error);
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Desarquivar conversa
  fastify.post('/:id/unarchive', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      // Verificar se o usuário é participante da conversa
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: id,
          userId,
        },
      });

      if (!participation) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }

      // Atualizar o participante para desarquivar a conversa
      await prisma.conversationParticipant.update({
        where: {
          id: participation.id,
        },
        data: {
          isArchived: false,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao desarquivar conversa:', error);
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });
}
