import { FastifyReply } from 'fastify';

// Tipos de erro customizados
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
}

// Classe base para erros customizados
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Erros específicos
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, ErrorType.VALIDATION, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Token de autenticação inválido') {
    super(message, ErrorType.AUTHENTICATION, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, ErrorType.AUTHORIZATION, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, ErrorType.NOT_FOUND, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflito de dados') {
    super(message, ErrorType.CONFLICT, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Muitas requisições') {
    super(message, ErrorType.RATE_LIMIT, 429);
  }
}

// Handler de erros global
export const handleError = (error: unknown, reply: FastifyReply) => {
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

// Wrapper para rotas com tratamento de erro
export const withErrorHandling = (
  handler: (request: any, reply: FastifyReply) => Promise<any>
) => {
  return async (request: any, reply: FastifyReply) => {
    try {
      return await handler(request, reply);
    } catch (error) {
      return handleError(error, reply);
    }
  };
};
