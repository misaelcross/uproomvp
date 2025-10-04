import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { requireAuth, AuthenticatedRequest } from '../lib/session-middleware';
import { config } from '../lib/config';

const createInvitationSchema = z.object({
  email: z.string().email().optional(),
  companyId: z.string(),
  role: z.enum(['MEMBER', 'ADMIN', 'OWNER']).optional().default('MEMBER'),
  expiresAt: z
    .union([z.string().datetime().optional(), z.date().optional()])
    .optional(),
  maxUses: z.number().int().min(1).optional().default(1),
});

const acceptInvitationSchema = z.object({
  token: z.string(),
});

export async function invitationRoutes(fastify: FastifyInstance) {
  // Enviar convite (gera link único por email/workspace)
  fastify.post('/send', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, companyId, role, expiresAt, maxUses } = createInvitationSchema.parse(request.body);
      const userId = (request as AuthenticatedRequest).user.id;

      // Verificar se o usuário é owner/admin da empresa OU possui permissão canInvite
      const membership = await prisma.companyMember.findFirst({
        where: {
          companyId,
          userId,
          OR: [
            { role: { in: ['OWNER', 'ADMIN'] } },
            { canInvite: true },
          ],
        },
      });

      if (!membership) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }

      // Verificar se o usuário já é membro (apenas se email foi fornecido)
      if (email) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          const existingMembership = await prisma.companyMember.findFirst({
            where: {
              companyId,
              userId: existingUser.id,
            },
          });

          if (existingMembership) {
            return reply.status(400).send({ error: 'Usuário já é membro da empresa' });
          }
        }
      }

      // Invalidar convites anteriores pendentes para o mesmo email/company (garante unicidade de uso)
      if (email) {
        await prisma.invitation.updateMany({
          where: { email, companyId, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        });
      }

      const token = crypto.randomUUID();
      const invitation = await prisma.invitation.create({
        data: {
          email: email || '',
          companyId,
          role,
          invitedById: userId,
          token,
          expiresAt: expiresAt ? new Date(expiresAt as any) : undefined,
          maxUses: typeof maxUses === 'number' ? maxUses : 1,
        },
        include: { 
          company: true, 
          invitedBy: true 
        },
      });

      // Monta URL do convite preferindo subdomínio do workspace
      // Em dev, FRONTEND_URL pode não suportar subdomínio; nesses casos, use caminho relativo
      const baseFrontend = config.FRONTEND_URL.replace(/\/$/, '');
      const subdomain = (invitation as any).company.subdomain;
      const legacyAcceptPath = `/accept-invitation/${invitation.token}`;
      const invitePath = `/invite/${invitation.token}`;
      const invitationUrl = `${baseFrontend}${legacyAcceptPath}`;

      return { success: true, invitation, invitationUrl, invitePath, legacyAcceptPath, subdomain };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });

  // Validar convite por token (sem autenticação)
  fastify.get('/validate/:token', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = request.params as { token: string };

      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: { company: true, invitedBy: true },
      });

      if (!invitation) {
        return { success: false, message: 'Convite inválido' };
      }

      if (invitation.status !== 'PENDING') {
        return { success: false, message: 'Convite já foi processado' };
      }

      // Verificar expiração
      const expirationDate = invitation.expiresAt
        ? new Date(invitation.expiresAt)
        : (() => { const d = new Date(invitation.createdAt); d.setDate(d.getDate() + 7); return d; })();
      if (new Date() > expirationDate) {
        return { success: false, message: 'Convite expirado' };
      }

      // Validar subdomínio, se fornecido pelo cliente
      const clientSubdomain = (request.headers['x-workspace-subdomain'] as string | undefined)?.toLowerCase();
      if (clientSubdomain && clientSubdomain !== invitation.company.subdomain.toLowerCase()) {
        return { success: false, message: 'Convite não pertence a este workspace' };
      }

      return { success: true, message: 'Convite válido', invitation };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });

  // Listar convites da empresa
  fastify.get('/company/:companyId', {
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

      const invitations = await prisma.invitation.findMany({
        where: { companyId },
        include: {
          invitedBy: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return { invitations };
    } catch (error) {
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });

  // Aceitar convite (requer autenticação; usa email do usuário para validar)
  fastify.post('/accept', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = acceptInvitationSchema.parse(request.body);
      const authUser = (request as AuthenticatedRequest).user;

      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: { company: true },
      });

      if (!invitation) {
        return reply.status(404).send({ error: 'Convite não encontrado' });
      }

      if (invitation.status !== 'PENDING') {
        return reply.status(400).send({ error: 'Convite já foi processado' });
      }

      // Verificar subdomínio informado pelo cliente
      const clientSubdomain = (request.headers['x-workspace-subdomain'] as string | undefined)?.toLowerCase();
      if (!clientSubdomain || clientSubdomain !== invitation.company.subdomain.toLowerCase()) {
        return reply.status(400).send({ error: 'Convite não pertence a este workspace' });
      }

      // Verificar expiração (usa expiresAt se existir, senão fallback 7 dias)
      const expirationDate = invitation.expiresAt
        ? new Date(invitation.expiresAt)
        : (() => { const d = new Date(invitation.createdAt); d.setDate(d.getDate() + 7); return d; })();

      if (new Date() > expirationDate) {
        return reply.status(400).send({ error: 'Convite expirado' });
      }

      // Garantir que o email do usuário autenticado corresponde ao email convidado (se email foi especificado)
      if (invitation.email && invitation.email.length > 0) {
        if (authUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
          return reply.status(403).send({ error: 'Este convite não corresponde ao seu email' });
        }
      }

      // Verificar limite de uso
      if (invitation.usedCount >= invitation.maxUses) {
        return reply.status(400).send({ error: 'Convite já atingiu o limite de uso' });
      }

      // Adicionar usuário à empresa
      const existingMembership = await prisma.companyMember.findFirst({
        where: { companyId: invitation.companyId, userId: authUser.id },
      });

      if (!existingMembership) {
        await prisma.companyMember.create({
          data: {
            companyId: invitation.companyId,
            userId: authUser.id,
            role: invitation.role,
          },
        });
      }

      // Marcar convite como usado/aceito
      const newUsedCount = invitation.usedCount + 1;
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          usedCount: newUsedCount,
          status: newUsedCount >= invitation.maxUses ? 'ACCEPTED' : 'PENDING',
          acceptedAt: new Date(),
          receiverId: authUser.id,
          acceptedIp: (request.ip || '').toString(),
        },
      });

      return { success: true, company: invitation.company };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });

  // Cancelar convite
  fastify.delete('/:id', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
      const userId = request.user.id;

      const invitation = await prisma.invitation.findFirst({
        where: {
          id,
          invitedById: userId,
        },
      });

      if (!invitation) {
        return reply.status(404).send({ error: 'Convite não encontrado' });
      }

      await prisma.invitation.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });
}
