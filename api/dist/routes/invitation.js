"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationRoutes = invitationRoutes;
const zod_1 = require("zod");
const database_1 = require("../lib/database");
const session_middleware_1 = require("../lib/session-middleware");
const config_1 = require("../lib/config");
const createInvitationSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    companyId: zod_1.z.string(),
    role: zod_1.z.enum(['MEMBER', 'ADMIN', 'OWNER']).optional().default('MEMBER'),
    expiresAt: zod_1.z
        .union([zod_1.z.string().datetime().optional(), zod_1.z.date().optional()])
        .optional(),
    maxUses: zod_1.z.number().int().min(1).optional().default(1),
});
const acceptInvitationSchema = zod_1.z.object({
    token: zod_1.z.string(),
});
async function invitationRoutes(fastify) {
    // Enviar convite (gera link único por email/workspace)
    fastify.post('/send', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { email, companyId, role, expiresAt, maxUses } = createInvitationSchema.parse(request.body);
            const userId = request.user.id;
            // Verificar se o usuário é owner/admin da empresa OU possui permissão canInvite
            const membership = await database_1.prisma.companyMember.findFirst({
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
                const existingUser = await database_1.prisma.user.findUnique({
                    where: { email },
                });
                if (existingUser) {
                    const existingMembership = await database_1.prisma.companyMember.findFirst({
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
                await database_1.prisma.invitation.updateMany({
                    where: { email, companyId, status: 'PENDING' },
                    data: { status: 'CANCELLED' },
                });
            }
            const token = crypto.randomUUID();
            const invitation = await database_1.prisma.invitation.create({
                data: {
                    email: email || '',
                    companyId,
                    role,
                    invitedById: userId,
                    token,
                    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                    maxUses: typeof maxUses === 'number' ? maxUses : 1,
                },
                include: {
                    company: true,
                    invitedBy: true
                },
            });
            // Monta URL do convite preferindo subdomínio do workspace
            // Em dev, FRONTEND_URL pode não suportar subdomínio; nesses casos, use caminho relativo
            const baseFrontend = config_1.config.FRONTEND_URL.replace(/\/$/, '');
            const subdomain = invitation.company.subdomain;
            const legacyAcceptPath = `/accept-invitation/${invitation.token}`;
            const invitePath = `/invite/${invitation.token}`;
            const invitationUrl = `${baseFrontend}${legacyAcceptPath}`;
            return { success: true, invitation, invitationUrl, invitePath, legacyAcceptPath, subdomain };
        }
        catch (error) {
            return reply.status(400).send({ error: 'Dados inválidos' });
        }
    });
    // Validar convite por token (sem autenticação)
    fastify.get('/validate/:token', async (request, reply) => {
        try {
            const { token } = request.params;
            const invitation = await database_1.prisma.invitation.findUnique({
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
            const clientSubdomain = request.headers['x-workspace-subdomain']?.toLowerCase();
            if (clientSubdomain && clientSubdomain !== invitation.company.subdomain.toLowerCase()) {
                return { success: false, message: 'Convite não pertence a este workspace' };
            }
            return { success: true, message: 'Convite válido', invitation };
        }
        catch (error) {
            return reply.status(400).send({ error: 'Dados inválidos' });
        }
    });
    // Listar convites da empresa
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
            const invitations = await database_1.prisma.invitation.findMany({
                where: { companyId },
                include: {
                    invitedBy: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            return { invitations };
        }
        catch (error) {
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
    // Aceitar convite (requer autenticação; usa email do usuário para validar)
    fastify.post('/accept', { preHandler: session_middleware_1.requireAuth }, async (request, reply) => {
        try {
            const { token } = acceptInvitationSchema.parse(request.body);
            const authUser = request.user;
            const invitation = await database_1.prisma.invitation.findUnique({
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
            const clientSubdomain = request.headers['x-workspace-subdomain']?.toLowerCase();
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
            const existingMembership = await database_1.prisma.companyMember.findFirst({
                where: { companyId: invitation.companyId, userId: authUser.id },
            });
            if (!existingMembership) {
                await database_1.prisma.companyMember.create({
                    data: {
                        companyId: invitation.companyId,
                        userId: authUser.id,
                        role: invitation.role,
                    },
                });
            }
            // Marcar convite como usado/aceito
            const newUsedCount = invitation.usedCount + 1;
            await database_1.prisma.invitation.update({
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
        }
        catch (error) {
            return reply.status(400).send({ error: 'Dados inválidos' });
        }
    });
    // Cancelar convite
    fastify.delete('/:id', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            // @ts-expect-error: 'user' é adicionado pelo middleware authenticateUser
            const userId = request.user.id;
            const invitation = await database_1.prisma.invitation.findFirst({
                where: {
                    id,
                    invitedById: userId,
                },
            });
            if (!invitation) {
                return reply.status(404).send({ error: 'Convite não encontrado' });
            }
            await database_1.prisma.invitation.delete({
                where: { id },
            });
            return { success: true };
        }
        catch (error) {
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
}
//# sourceMappingURL=invitation.js.map