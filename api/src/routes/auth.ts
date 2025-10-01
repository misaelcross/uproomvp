import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const createUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Criar ou atualizar usuário após login
  fastify.post('/user', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id, email, name } = createUserSchema.parse(request.body);

      const user = await prisma.user.upsert({
        where: { id },
        update: { email, name },
        create: { id, email, name },
      });

      return { user };
    } catch (error) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }
  });

  // Obter perfil do usuário
  fastify.get('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.status(401).send({ error: 'Token não fornecido' });
      }

      const token = authHeader.replace('Bearer ', '');
      // Aqui você validaria o token com Supabase
      // Por enquanto, vamos retornar um usuário mock
      
      return {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          name: 'Usuário Teste',
        },
      };
    } catch (error) {
      return reply.status(500).send({ error: 'Erro interno' });
    }
  });
}
