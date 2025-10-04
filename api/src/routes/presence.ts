import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { requireAuth } from '../lib/session-middleware';
import { wsManager } from '../lib/websocket';

const updatePresenceSchema = z.object({
  status: z.enum(['AVAILABLE', 'FOCUS', 'MEETING', 'AWAY', 'BREAK', 'EMERGENCY', 'OFFLINE']),
  message: z.string().optional(),
  isOnline: z.boolean().optional(),
});

export async function presenceRoutes(fastify: FastifyInstance) {
  // Get user presence for a company
  fastify.get('/:companyId', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { companyId } = request.params as { companyId: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      // Verificar se o usuário é membro da empresa
      const membership = await prisma.companyMember.findFirst({
        where: {
          companyId,
          userId,
        },
      });

      if (!membership) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }

      const presence = await prisma.userPresence.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId,
          },
        },
      });

      if (!presence) {
        // Create default presence if none exists
        const defaultPresence = await prisma.userPresence.create({
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
    } catch (error) {
      console.error('Error getting user presence:', error);
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Update user presence
  fastify.put('/:companyId', {
    preHandler: requireAuth,
    schema: {
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['AVAILABLE', 'FOCUS', 'MEETING', 'AWAY', 'BREAK', 'EMERGENCY', 'OFFLINE']
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
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { companyId } = request.params as { companyId: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;
      const updateData = updatePresenceSchema.parse(request.body);

      // Verificar se o usuário é membro da empresa
      const membership = await prisma.companyMember.findFirst({
        where: {
          companyId,
          userId,
        },
      });

      if (!membership) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }

      const presence = await prisma.userPresence.upsert({
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

      // Notificar via WebSocket sobre a mudança de presença
      wsManager.notifyPresenceUpdate(userId, companyId, presence);

      console.log('✅ Presence updated and broadcast:', { userId, companyId, status: presence.status });

      return { presence };
    } catch (error) {
      console.error('Error updating user presence:', error);
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Get all company members presence
  fastify.get('/:companyId/members', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { companyId } = request.params as { companyId: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      // Verificar se o usuário é membro da empresa
      const membership = await prisma.companyMember.findFirst({
        where: {
          companyId,
          userId,
        },
      });

      if (!membership) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }

      const presences = await prisma.userPresence.findMany({
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
    } catch (error) {
      console.error('Error getting company presences:', error);
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });
}
