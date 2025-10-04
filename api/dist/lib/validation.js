"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateData = exports.paginationSchema = exports.updatePresenceSchema = exports.updateUserSchema = exports.createInvitationSchema = exports.updateMessageSchema = exports.createMessageSchema = exports.updateConversationSchema = exports.createConversationSchema = exports.updateCompanySchema = exports.createCompanySchema = exports.updatePasswordSchema = exports.resetPasswordSchema = exports.signUpSchema = exports.signInSchema = exports.uuidSchema = exports.nameSchema = exports.passwordSchema = exports.emailSchema = void 0;
const zod_1 = require("zod");
// Schemas de validação reutilizáveis
exports.emailSchema = zod_1.z.string().email('Email inválido');
exports.passwordSchema = zod_1.z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
exports.nameSchema = zod_1.z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo');
exports.uuidSchema = zod_1.z.string().uuid('ID inválido');
// Schemas para autenticação
exports.signInSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
});
exports.signUpSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    fullName: exports.nameSchema.optional(),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: exports.emailSchema,
});
exports.updatePasswordSchema = zod_1.z.object({
    password: exports.passwordSchema,
});
// Schemas para empresas
exports.createCompanySchema = zod_1.z.object({
    name: exports.nameSchema,
    subdomain: zod_1.z.string()
        .min(3, 'Subdomínio deve ter pelo menos 3 caracteres')
        .max(50, 'Subdomínio muito longo')
        .regex(/^[a-z0-9-]+$/, 'Subdomínio deve conter apenas letras minúsculas, números e hífens'),
    description: zod_1.z.string().max(500, 'Descrição muito longa').optional(),
});
exports.updateCompanySchema = zod_1.z.object({
    name: exports.nameSchema.optional(),
    description: zod_1.z.string().max(500, 'Descrição muito longa').optional(),
});
// Schemas para conversas
exports.createConversationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
    description: zod_1.z.string().max(1000, 'Descrição muito longa').optional(),
    isPrivate: zod_1.z.boolean().default(false),
});
exports.updateConversationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo').optional(),
    description: zod_1.z.string().max(1000, 'Descrição muito longa').optional(),
    isPrivate: zod_1.z.boolean().optional(),
});
// Schemas para mensagens
exports.createMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Mensagem não pode estar vazia').max(2000, 'Mensagem muito longa'),
    conversationId: exports.uuidSchema,
    replyToId: exports.uuidSchema.optional(),
});
exports.updateMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Mensagem não pode estar vazia').max(2000, 'Mensagem muito longa'),
});
// Schemas para convites
exports.createInvitationSchema = zod_1.z.object({
    email: exports.emailSchema,
    companyId: exports.uuidSchema,
    role: zod_1.z.enum(['MEMBER', 'ADMIN']).default('MEMBER'),
});
// Schemas para usuários
exports.updateUserSchema = zod_1.z.object({
    fullName: exports.nameSchema.optional(),
    avatar: zod_1.z.string().url('URL do avatar inválida').optional(),
});
// Schemas para presença
exports.updatePresenceSchema = zod_1.z.object({
    status: zod_1.z.enum(['ONLINE', 'AWAY', 'BUSY', 'OFFLINE']),
    message: zod_1.z.string().max(100, 'Mensagem de status muito longa').optional(),
});
// Schemas para paginação
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// Função helper para validar dados
const validateData = (schema, data) => {
    try {
        return schema.parse(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
            throw new Error(`Dados inválidos: ${errorMessages}`);
        }
        throw error;
    }
};
exports.validateData = validateData;
//# sourceMappingURL=validation.js.map