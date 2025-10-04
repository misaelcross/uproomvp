import 'dotenv/config';
import { FastifyRequest, FastifyReply } from 'fastify';
export interface AuthenticatedRequest extends FastifyRequest {
    user: {
        id: string;
        email: string;
    };
}
export declare const authenticateUser: (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
//# sourceMappingURL=auth.d.ts.map