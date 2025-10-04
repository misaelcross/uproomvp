"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyRoutes = companyRoutes;
const zod_1 = require("zod");
const database_1 = require("../lib/database");
const session_middleware_1 = require("../lib/session-middleware");
const createCompanySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Company name is required'),
    subdomain: zod_1.z.string()
        .min(3, 'Subdomain must be at least 3 characters')
        .max(50, 'Subdomain must be at most 50 characters')
        .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
        .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Subdomain cannot start or end with a hyphen'),
    description: zod_1.z.string().optional(),
});
const updateCompanySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
});
async function companyRoutes(fastify) {
    // Endpoint de teste para debug
    fastify.post('/test', async (request, reply) => {
        console.log('Test endpoint - Request body:', request.body);
        console.log('Test endpoint - Request headers:', request.headers);
        return { message: 'Test successful', body: request.body };
    });
    // Criar empresa
    fastify.post('/', {
        preHandler: session_middleware_1.requireAuth,
        schema: {
            tags: ['companies'],
            summary: 'Criar nova empresa',
            description: 'Cria uma nova empresa com o usuário autenticado como proprietário',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['name', 'subdomain'],
                properties: {
                    name: {
                        type: 'string',
                        description: 'Nome da empresa'
                    },
                    subdomain: {
                        type: 'string',
                        description: 'Subdomínio único para a empresa',
                        pattern: '^[a-z0-9-]+$'
                    },
                    description: {
                        type: 'string',
                        description: 'Descrição opcional da empresa'
                    }
                }
            },
            response: {
                200: {
                    description: 'Empresa criada com sucesso',
                    type: 'object',
                    properties: {
                        company: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                subdomain: { type: 'string' },
                                description: { type: 'string' },
                                ownerId: { type: 'string' },
                                createdAt: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                },
                400: {
                    description: 'Dados inválidos',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        details: { type: 'string' }
                    }
                },
                401: {
                    description: 'Token de autenticação inválido',
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            console.log('Request body:', request.body);
            console.log('Request headers:', request.headers);
            // Validar cada campo individualmente para debug
            const body = request.body;
            console.log('Raw body fields:', {
                name: body.name,
                subdomain: body.subdomain,
                description: body.description,
                nameType: typeof body.name,
                subdomainType: typeof body.subdomain,
                descriptionType: typeof body.description
            });
            // Validar schema com tratamento de erro detalhado
            let validatedData;
            try {
                validatedData = createCompanySchema.parse(request.body);
            }
            catch (validationError) {
                console.error('Validation error:', validationError);
                return reply.status(400).send({
                    error: 'Validation failed',
                    details: validationError.errors || validationError.message
                });
            }
            const { name, subdomain, description } = validatedData;
            const userId = request.user.id;
            console.log('Parsed data:', { name, subdomain, description, userId });
            // Verificar se o subdomínio já existe
            const existingCompany = await database_1.prisma.company.findUnique({
                where: { subdomain },
            });
            if (existingCompany) {
                return reply.status(400).send({ error: 'Subdomínio já está em uso' });
            }
            const company = await database_1.prisma.company.create({
                data: {
                    name,
                    subdomain,
                    description,
                    ownerId: userId,
                },
            });
            // Adicionar o criador como membro
            await database_1.prisma.companyMember.create({
                data: {
                    companyId: company.id,
                    userId,
                    role: 'OWNER',
                },
            });
            return { company };
        }
        catch (error) {
            console.error('Validation error:', error);
            return reply.status(400).send({ error: 'Dados inválidos', details: error.message });
        }
    });
    // Listar empresas do usuário
    fastify.get('/', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const companies = await database_1.prisma.company.findMany({
                where: {
                    members: {
                        some: {
                            userId,
                        },
                    },
                },
                include: {
                    members: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
            return { companies: companies || [] };
        }
        catch (error) {
            console.error('Error getting companies:', error);
            return reply.status(500).send({ error: 'Erro interno', details: error.message });
        }
    });
    // Listar empresas do usuário por ID
    fastify.get('/user/:userId', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            console.log('🔍 Company API: Buscando empresas para usuário:', userId);
            console.log('🔍 Company API: Usuário autenticado:', request.user.id);
            // Verificar se o usuário está tentando acessar suas próprias empresas
            if (request.user.id !== userId) {
                console.log('❌ Company API: Usuário tentando acessar empresas de outro usuário');
                return reply.status(403).send({ error: 'Acesso negado' });
            }
            const companies = await database_1.prisma.company.findMany({
                where: {
                    members: {
                        some: {
                            userId,
                        },
                    },
                },
                include: {
                    members: {
                        where: {
                            userId,
                        },
                        include: {
                            user: true,
                        },
                    },
                },
            });
            // Adicionar role do usuário em cada empresa
            const companiesWithRole = companies.map(company => ({
                ...company,
                userRole: company.members[0]?.role || 'MEMBER',
                isOwner: company.ownerId === userId,
            }));
            console.log('🔍 Company API: Empresas encontradas:', companiesWithRole.length);
            console.log('🔍 Company API: Empresas:', companiesWithRole.map(c => ({
                id: c.id,
                name: c.name,
                subdomain: c.subdomain,
                userRole: c.userRole,
                isOwner: c.isOwner
            })));
            return { companies: companiesWithRole || [] };
        }
        catch (error) {
            console.error('Error getting user companies:', error);
            return reply.status(500).send({ error: 'Erro interno', details: error.message });
        }
    });
    // Obter empresa por ID
    fastify.get('/:id', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.id;
            const company = await database_1.prisma.company.findFirst({
                where: {
                    id,
                    members: {
                        some: {
                            userId,
                        },
                    },
                },
                include: {
                    members: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
            if (!company) {
                return reply.status(404).send({ error: 'Empresa não encontrada' });
            }
            return { company };
        }
        catch (error) {
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
    // Atualizar empresa
    fastify.put('/:id', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.id;
            const updateData = updateCompanySchema.parse(request.body);
            // Verificar se o usuário é owner da empresa
            const membership = await database_1.prisma.companyMember.findFirst({
                where: {
                    companyId: id,
                    userId,
                    role: 'OWNER',
                },
            });
            if (!membership) {
                return reply.status(403).send({ error: 'Acesso negado' });
            }
            const company = await database_1.prisma.company.update({
                where: { id },
                data: updateData,
            });
            return { company };
        }
        catch (error) {
            return reply.status(400).send({ error: 'Dados inválidos' });
        }
    });
    // Verificar disponibilidade de subdomínio
    fastify.get('/check-subdomain/:subdomain', {
        schema: {
            tags: ['companies'],
            summary: 'Verificar disponibilidade de subdomínio',
            description: 'Verifica se um subdomínio está disponível para uso',
            params: {
                type: 'object',
                required: ['subdomain'],
                properties: {
                    subdomain: {
                        type: 'string',
                        description: 'Subdomínio a ser verificado',
                    }
                }
            },
            response: {
                200: {
                    description: 'Resultado da verificação',
                    type: 'object',
                    properties: {
                        available: {
                            type: 'boolean',
                            description: 'Indica se o subdomínio está disponível'
                        }
                    }
                },
                500: {
                    description: 'Erro interno do servidor',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        details: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { subdomain } = request.params;
            if (!subdomain || subdomain.trim() === '') {
                return reply.status(400).send({ error: 'Subdomínio é obrigatório' });
            }
            const existingCompany = await database_1.prisma.company.findUnique({
                where: { subdomain: subdomain.trim() },
            });
            return { available: !existingCompany };
        }
        catch (error) {
            console.error('Error checking subdomain:', error);
            return reply.status(500).send({ error: 'Erro interno', details: error.message });
        }
    });
    // Buscar empresa por subdomínio
    fastify.get('/subdomain/:subdomain', {
        schema: {
            tags: ['companies'],
            summary: 'Buscar empresa por subdomínio',
            description: 'Busca uma empresa pelo seu subdomínio único',
            params: {
                type: 'object',
                required: ['subdomain'],
                properties: {
                    subdomain: {
                        type: 'string',
                        description: 'Subdomínio da empresa',
                    }
                }
            },
            response: {
                200: {
                    description: 'Empresa encontrada',
                    type: 'object',
                    properties: {
                        company: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                subdomain: { type: 'string' },
                                description: { type: 'string' },
                                ownerId: { type: 'string' },
                                createdAt: { type: 'string', format: 'date-time' },
                                members: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            role: { type: 'string' },
                                            user: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string' },
                                                    email: { type: 'string' },
                                                    name: { type: 'string' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Empresa não encontrada',
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                },
                500: {
                    description: 'Erro interno do servidor',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        details: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { subdomain } = request.params;
            if (!subdomain || subdomain.trim() === '') {
                return reply.status(400).send({ error: 'Subdomínio é obrigatório' });
            }
            const company = await database_1.prisma.company.findUnique({
                where: { subdomain: subdomain.trim() },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            if (!company) {
                return reply.status(404).send({ error: 'Empresa não encontrada' });
            }
            return { company };
        }
        catch (error) {
            console.error('Error getting company by subdomain:', error);
            return reply.status(500).send({ error: 'Erro interno', details: error.message });
        }
    });
    // Get company members
    fastify.get('/:id/members', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.id;
            console.log('🔍 Company API: Buscando membros para company:', id);
            console.log('🔍 Company API: Usuário autenticado:', userId);
            // Verificar se o usuário é membro da empresa
            const membership = await database_1.prisma.companyMember.findFirst({
                where: {
                    companyId: id,
                    userId,
                },
            });
            console.log('🔍 Company API: Membership encontrado:', !!membership);
            if (!membership) {
                console.log('❌ Company API: Usuário não é membro da empresa');
                return reply.status(403).send({ error: 'Acesso negado' });
            }
            const members = await database_1.prisma.companyMember.findMany({
                where: { companyId: id },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            fullName: true,
                            avatar: true,
                        },
                    },
                },
            });
            console.log('🔍 Company API: Membros encontrados:', members.length);
            console.log('🔍 Company API: Membros:', members.map(m => ({ id: m.user.id, email: m.user.email, name: m.user.name })));
            return { members };
        }
        catch (error) {
            console.error('Error getting company members:', error);
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
    // Get user role in company
    fastify.get('/:id/members/:userId/role', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { id, userId } = request.params;
            const authenticatedUserId = request.user.id;
            // Verificar se o usuário autenticado é membro da empresa
            const membership = await database_1.prisma.companyMember.findFirst({
                where: {
                    companyId: id,
                    userId: authenticatedUserId,
                },
            });
            if (!membership) {
                return reply.status(403).send({ error: 'Acesso negado' });
            }
            // Buscar o role do usuário solicitado
            const userMembership = await database_1.prisma.companyMember.findFirst({
                where: {
                    companyId: id,
                    userId,
                },
            });
            if (!userMembership) {
                return reply.status(404).send({ error: 'Usuário não é membro desta empresa' });
            }
            return { role: userMembership.role };
        }
        catch (error) {
            console.error('Error getting user role:', error);
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
    // Get current user role in company (the missing route)
    fastify.get('/:id/user-role', {
        preHandler: session_middleware_1.requireAuth,
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.id;
            // Buscar o role do usuário autenticado nesta empresa
            const membership = await database_1.prisma.companyMember.findFirst({
                where: {
                    companyId: id,
                    userId,
                },
            });
            if (!membership) {
                return reply.status(404).send({ error: 'Usuário não é membro desta empresa' });
            }
            return { role: membership.role };
        }
        catch (error) {
            console.error('Error getting user role:', error);
            return reply.status(500).send({ error: 'Erro interno' });
        }
    });
}
//# sourceMappingURL=company.js.map