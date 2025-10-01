import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateUser } from '../lib/auth';

const createConversationSchema = z.object({
  title: z.string().min(1),
  companyId: z.string(),
  type: z.enum(['DIRECT', 'GROUP']).optional().default('DIRECT'),
  participantIds: z.array(z.string()).optional(),
});

const updateConversationSchema = z.object({
  title: z.string().min(1).optional(),
});

export async function conversationRoutes(fastify: FastifyInstance) {
  // Criar conversa
  fastify.post('/', {
    preHandler: authenticateUser,
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

      return { conversation };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });

  // Listar conversas do usuário
  fastify.get('/', {
    preHandler: authenticateUser,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;
      const { companyId } = request.query as { companyId?: string };

      const whereClause: any = {
        participants: {
          some: {
            userId,
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
    preHandler: authenticateUser,
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
    preHandler: authenticateUser,
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
    preHandler: authenticateUser,
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
}
