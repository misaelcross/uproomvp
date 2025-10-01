import 'dotenv/config';
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from './prisma';

const authHeaderSchema = z.object({
  authorization: z.string().regex(/^Bearer .+$/),
});

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
  };
}

export const authenticateUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { authorization } = authHeaderSchema.parse(request.headers);
    const token = authorization.replace('Bearer ', '');

    console.log('Token recebido:', token.substring(0, 20) + '...');
    
    // Para debug, usar um ID fixo temporário
    const debugUserId = '379fa24f-559f-4535-9173-7e4a0a043ddb';
    const debugUserEmail = 'user@example.com';
    
    // Verificar se o usuário existe no banco local
    let user = await prisma.user.findUnique({
      where: { id: debugUserId }
    });
    
    // Se não existir, criar o usuário
    if (!user) {
      console.log('Usuário não encontrado, criando...');
      user = await prisma.user.create({
        data: {
          id: debugUserId,
          email: debugUserEmail,
          name: 'Debug User'
        }
      });
      console.log('Usuário criado:', user);
    }
    
    (request as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
    };
    
    // Código original comentado para debug:
    // const { data: { user }, error } = await supabase.auth.getUser(token);
    // if (error || !user) {
    //   return reply.status(401).send({ error: 'Token inválido' });
    // }
    // (request as AuthenticatedRequest).user = {
    //   id: user.id,
    //   email: user.email || '',
    // };
  } catch (error) {
    console.error('Authentication error:', error);
    return reply.status(401).send({ error: 'Token de autenticação inválido' });
  }
};
