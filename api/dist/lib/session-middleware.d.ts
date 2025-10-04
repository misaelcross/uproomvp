import { FastifyRequest, FastifyReply } from 'fastify';
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
export declare const requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
/**
 * Middleware opcional para verificar autenticação (não falha se não houver token)
 */
export declare const optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
//# sourceMappingURL=session-middleware.d.ts.map