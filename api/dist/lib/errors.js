"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withErrorHandling = exports.handleError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = exports.ErrorType = void 0;
// Tipos de erro customizados
var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "VALIDATION_ERROR";
    ErrorType["AUTHENTICATION"] = "AUTHENTICATION_ERROR";
    ErrorType["AUTHORIZATION"] = "AUTHORIZATION_ERROR";
    ErrorType["NOT_FOUND"] = "NOT_FOUND_ERROR";
    ErrorType["CONFLICT"] = "CONFLICT_ERROR";
    ErrorType["INTERNAL"] = "INTERNAL_ERROR";
    ErrorType["RATE_LIMIT"] = "RATE_LIMIT_ERROR";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
// Classe base para erros customizados
class AppError extends Error {
    type;
    statusCode;
    isOperational;
    constructor(message, type, statusCode = 500, isOperational = true) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Erros específicos
class ValidationError extends AppError {
    constructor(message) {
        super(message, ErrorType.VALIDATION, 400);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Token de autenticação inválido') {
        super(message, ErrorType.AUTHENTICATION, 401);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Acesso negado') {
        super(message, ErrorType.AUTHORIZATION, 403);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(message = 'Recurso não encontrado') {
        super(message, ErrorType.NOT_FOUND, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Conflito de dados') {
        super(message, ErrorType.CONFLICT, 409);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Muitas requisições') {
        super(message, ErrorType.RATE_LIMIT, 429);
    }
}
exports.RateLimitError = RateLimitError;
// Handler de erros global
const handleError = (error, reply) => {
    console.error('🚨 Erro capturado:', error);
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            error: error.message,
            type: error.type,
            statusCode: error.statusCode,
        });
    }
    if (error instanceof Error) {
        return reply.status(500).send({
            error: 'Erro interno do servidor',
            type: ErrorType.INTERNAL,
            statusCode: 500,
        });
    }
    return reply.status(500).send({
        error: 'Erro desconhecido',
        type: ErrorType.INTERNAL,
        statusCode: 500,
    });
};
exports.handleError = handleError;
// Wrapper para rotas com tratamento de erro
const withErrorHandling = (handler) => {
    return async (request, reply) => {
        try {
            return await handler(request, reply);
        }
        catch (error) {
            return (0, exports.handleError)(error, reply);
        }
    };
};
exports.withErrorHandling = withErrorHandling;
//# sourceMappingURL=errors.js.map