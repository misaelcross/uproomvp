import { z } from 'zod';

// Schemas de validação reutilizáveis
export const emailSchema = z.string().email('Email inválido');
export const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
export const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo');
export const uuidSchema = z.string().uuid('ID inválido');

// Schemas para autenticação
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema.optional(),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

// Schemas para empresas
export const createCompanySchema = z.object({
  name: nameSchema,
  subdomain: z.string()
    .min(3, 'Subdomínio deve ter pelo menos 3 caracteres')
    .max(50, 'Subdomínio muito longo')
    .regex(/^[a-z0-9-]+$/, 'Subdomínio deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
});

export const updateCompanySchema = z.object({
  name: nameSchema.optional(),
  description: z.string().max(500, 'Descrição muito longa').optional(),
});

// Schemas para conversas
export const createConversationSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().max(1000, 'Descrição muito longa').optional(),
  isPrivate: z.boolean().default(false),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo').optional(),
  description: z.string().max(1000, 'Descrição muito longa').optional(),
  isPrivate: z.boolean().optional(),
});

// Schemas para mensagens
export const createMessageSchema = z.object({
  content: z.string().min(1, 'Mensagem não pode estar vazia').max(2000, 'Mensagem muito longa'),
  conversationId: uuidSchema,
  replyToId: uuidSchema.optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1, 'Mensagem não pode estar vazia').max(2000, 'Mensagem muito longa'),
});

// Schemas para convites
export const createInvitationSchema = z.object({
  email: emailSchema,
  companyId: uuidSchema,
  role: z.enum(['MEMBER', 'ADMIN']).default('MEMBER'),
});

// Schemas para usuários
export const updateUserSchema = z.object({
  fullName: nameSchema.optional(),
  avatar: z.string().url('URL do avatar inválida').optional(),
});

// Schemas para presença
export const updatePresenceSchema = z.object({
  status: z.enum(['ONLINE', 'AWAY', 'BUSY', 'OFFLINE']),
  message: z.string().max(100, 'Mensagem de status muito longa').optional(),
});

// Schemas para paginação
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Função helper para validar dados
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Dados inválidos: ${errorMessages}`);
    }
    throw error;
  }
};
