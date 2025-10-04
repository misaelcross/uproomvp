import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AuthService } from './auth-service';

const authHeaderSchema = z.object({
  authorization: z.string().regex(/^Bearer .+$/),
});

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    fullName?: string;
    avatar?: string;
  };
}

/**
 * Middleware para verificar autenticação em rotas protegidas
 */
export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    console.log('🔍 Session Middleware: Verificando autenticação para:', request.url);
    console.log('🔍 Session Middleware: Headers recebidos:', Object.keys(request.headers));
    console.log('🔍 Session Middleware: Authorization header:', request.headers.authorization ? 'Presente' : 'Ausente');
    console.log('🔍 Session Middleware: Authorization value:', request.headers.authorization);
    
    const { authorization } = authHeaderSchema.parse(request.headers);
    const token = authorization.replace('Bearer ', '');

    console.log('🔐 Session Middleware: Verificando token:', token.substring(0, 20) + '...');
    console.log('🔐 Session Middleware: JWT_SECRET configurado:', !!process.env.JWT_SECRET);
    
    // Verificar token JWT
    const decoded = AuthService.verifyToken(token);
    console.log('🔐 Session Middleware: Token decodificado:', decoded);
    
    if (!decoded) {
      console.log('❌ Session Middleware: Token inválido ou expirado');
      return reply.status(401).send({ error: 'Token inválido ou expirado' });
    }

    // Buscar dados do usuário no banco local
    const user = await AuthService.getUserByToken(token);
    console.log('🔐 Session Middleware: Usuário encontrado:', user);
    
    if (!user) {
      console.log('❌ Session Middleware: Usuário não encontrado');
      return reply.status(404).send({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Session Middleware: Usuário autenticado:', { id: user.id, email: user.email });
    
    // Adicionar usuário ao request
    (request as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
    };
    
    console.log('✅ Session Middleware: Request.user definido:', (request as AuthenticatedRequest).user);
    
  } catch (error) {
    console.error('❌ Session Middleware: Erro na autenticação:', error);
    console.error('❌ Session Middleware: URL:', request.url);
    console.error('❌ Session Middleware: Headers:', request.headers);
    console.error('❌ Session Middleware: Error type:', typeof error);
    console.error('❌ Session Middleware: Error message:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof z.ZodError) {
      console.error('❌ Session Middleware: Erro de validação do header:', error.errors);
      return reply.status(401).send({ error: 'Header de autorização inválido' });
    }
    
    return reply.status(401).send({ error: 'Token de autenticação inválido' });
  }
};

/**
 * Middleware opcional para verificar autenticação (não falha se não houver token)
 */
export const optionalAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Sem token, continuar sem autenticação
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = AuthService.verifyToken(token);
    
    if (!decoded) {
      // Token inválido, continuar sem autenticação
      return;
    }

    const user = await AuthService.getUserByToken(token);
    
    if (user) {
      (request as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
      };
    }
    
  } catch (error) {
    console.error('⚠️ Session Middleware: Erro na autenticação opcional:', error);
    // Não falha, apenas continua sem autenticação
  }
};
