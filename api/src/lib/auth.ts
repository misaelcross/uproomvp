import 'dotenv/config';
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from './database';
import { AuthService } from './auth-service';

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
    console.log('🔍 Auth: Verificando autenticação para:', request.url);
    console.log('🔍 Auth: Headers:', request.headers.authorization ? 'Authorization presente' : 'Sem Authorization');
    
    const { authorization } = authHeaderSchema.parse(request.headers);
    const token = authorization.replace('Bearer ', '');

    console.log('🔍 Auth: Token recebido:', token.substring(0, 20) + '...');
    
    // Verificar token JWT
    const decoded = AuthService.verifyToken(token);
    
    if (!decoded) {
      console.log('Token inválido ou expirado');
      return reply.status(401).send({ error: 'Token inválido' });
    }

    // Buscar dados do usuário no banco local
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!dbUser) {
      console.log('Usuário não encontrado no banco local:', decoded.userId);
      return reply.status(404).send({ error: 'Usuário não encontrado' });
    }
    
    console.log('Usuário autenticado:', { id: dbUser.id, email: dbUser.email });
    
    (request as AuthenticatedRequest).user = {
      id: dbUser.id,
      email: dbUser.email,
    };
    
  } catch (error) {
    console.error('❌ Auth: Erro de autenticação:', error);
    console.error('❌ Auth: URL:', request.url);
    console.error('❌ Auth: Headers:', request.headers);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Auth: Erro de validação do header:', error.errors);
      return reply.status(401).send({ error: 'Header de autorização inválido' });
    }
    
    return reply.status(401).send({ error: 'Token de autenticação inválido' });
  }
};
