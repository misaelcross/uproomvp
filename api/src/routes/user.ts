import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateUser, AuthenticatedRequest } from '../lib/auth';

export async function userRoutes(fastify: FastifyInstance) {
  // Obter perfil do usuário
  fastify.get('/profile', {
    preHandler: authenticateUser,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      const user = await prisma.user.findUnique({
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
    } catch (error) {
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Listar usuários de uma empresa
  fastify.get<{ Params: { companyId: string }; Reply: { members: any[] } }>('/company/:companyId', {
    preHandler: authenticateUser,
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

      const members = await prisma.companyMember.findMany({
        where: { companyId },
        include: {
          user: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return { members };
    } catch (error) {
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Buscar usuários por email
  fastify.get('/search', {
    preHandler: authenticateUser,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, companyId } = request.query as { email?: string; companyId?: string };

      if (!email) {
        return reply.status(400).send({ error: 'Email é obrigatório' });
      }

      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: email,
          },
        },
        take: 10,
      });

      // Se companyId foi fornecido, filtrar usuários que não são membros
      if (companyId) {
        const companyMembers = await prisma.companyMember.findMany({
          where: { companyId },
          select: { userId: true },
        });

        const memberIds = companyMembers.map(m => m.userId);
        const filteredUsers = users.filter(user => !memberIds.includes(user.id));

        return { users: filteredUsers };
      }

      return { users };
    } catch (error) {
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Atualizar perfil do usuário
  fastify.put('/profile', {
    preHandler: authenticateUser,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;
      const { name, email } = request.body as { name?: string; email?: string };

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
        },
      });

      return { user };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });
}
