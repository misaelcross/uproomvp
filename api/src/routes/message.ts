import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateUser } from '../lib/auth';

const createMessageSchema = z.object({
  content: z.string().min(1),
  conversationId: z.string(),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).optional().default('TEXT'),
});

const updateMessageSchema = z.object({
  content: z.string().min(1),
});

export async function messageRoutes(fastify: FastifyInstance) {
  // Criar mensagem
  fastify.post('/', {
    preHandler: authenticateUser,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { content, conversationId, type } = createMessageSchema.parse(request.body);
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      // Verificar se o usuário é participante da conversa
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
        },
      });

      if (!participation) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }

      const message = await prisma.message.create({
        data: {
          content,
          conversationId,
          userId,
          type,
        },
        include: {
          user: true,
        },
      });

      // Atualizar timestamp da conversa
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return { message };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });

  // Listar mensagens de uma conversa
  fastify.get('/conversation/:conversationId', {
    preHandler: authenticateUser,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { conversationId } = request.params as { conversationId: string };
      const { page = '1', limit = '50' } = request.query as { page?: string; limit?: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      // Verificar se o usuário é participante da conversa
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
        },
      });

      if (!participation) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      });

      const total = await prisma.message.count({
        where: { conversationId },
      });

      return {
        messages: messages.reverse(),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      };
    } catch (error) {
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Obter mensagem por ID
  fastify.get('/:id', {
    preHandler: authenticateUser,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      const message = await prisma.message.findFirst({
        where: {
          id,
          conversation: {
            participants: {
              some: {
                userId,
              },
            },
          },
        },
        include: {
          user: true,
        },
      });

      if (!message) {
        return reply.status(404).send({ error: 'Mensagem não encontrada' });
      }

      return { message };
    } catch (error) {
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Atualizar mensagem
  fastify.put('/:id', {
    preHandler: authenticateUser,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;
      const { content } = updateMessageSchema.parse(request.body);

      const message = await prisma.message.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!message) {
        return reply.status(404).send({ error: 'Mensagem não encontrada' });
      }

      const updatedMessage = await prisma.message.update({
        where: { id },
        data: { content },
        include: {
          user: true,
        },
      });

      return { message: updatedMessage };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });

  // Deletar mensagem
  fastify.delete('/:id', {
    preHandler: authenticateUser,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      const message = await prisma.message.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!message) {
        return reply.status(404).send({ error: 'Mensagem não encontrada' });
      }

      await prisma.message.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });
}
