import { FastifyReply } from 'fastify';
export declare enum ErrorType {
    VALIDATION = "VALIDATION_ERROR",
    AUTHENTICATION = "AUTHENTICATION_ERROR",
    AUTHORIZATION = "AUTHORIZATION_ERROR",
    NOT_FOUND = "NOT_FOUND_ERROR",
    CONFLICT = "CONFLICT_ERROR",
    INTERNAL = "INTERNAL_ERROR",
    RATE_LIMIT = "RATE_LIMIT_ERROR"
}
export declare class AppError extends Error {
    readonly type: ErrorType;
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, type: ErrorType, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
export declare const handleError: (error: unknown, reply: FastifyReply) => FastifyReply<import("fastify").RouteGenericInterface, import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, unknown, import("fastify").FastifySchema, import("fastify").FastifyTypeProviderDefault, unknown>;
export declare const withErrorHandling: (handler: (request: any, reply: FastifyReply) => Promise<any>) => (request: any, reply: FastifyReply) => Promise<any>;
//# sourceMappingURL=errors.d.ts.map