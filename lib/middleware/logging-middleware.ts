/**
 * 🔍 Logging Middleware - Middleware para logging automático de APIs
 *
 * Este middleware adiciona logging estruturado automático para todas as
 * requisições HTTP, incluindo métricas de performance e contexto.
 */
import { NextRequest, NextResponse } from 'next/server';

import {
  LogContext,
  PerformanceLogger,
  logger,
} from '../services/logger-service';

// 🏷️ Interface para configuração do middleware
export interface LoggingMiddlewareConfig {
  enableRequestLogging?: boolean;
  enableResponseLogging?: boolean;
  enableErrorLogging?: boolean;
  enablePerformanceLogging?: boolean;
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  excludePaths?: string[];
  sensitiveFields?: string[];
}

// ⚙️ Configuração padrão
const DEFAULT_CONFIG: LoggingMiddlewareConfig = {
  enableRequestLogging: true,
  enableResponseLogging: true,
  enableErrorLogging: true,
  enablePerformanceLogging: true,
  logRequestBody: false,
  logResponseBody: false,
  excludePaths: ['/api/health', '/api/metrics'],
  sensitiveFields: ['password', 'token', 'authorization', 'cookie'],
};

/**
 * 🧹 Sanitizar dados sensíveis
 */
function sanitizeData(data: any, sensitiveFields: string[]): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * 📊 Extrair contexto da requisição
 */
function extractRequestContext(request: NextRequest): LogContext {
  const url = new URL(request.url);

  return {
    method: request.method,
    endpoint: url.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    ip:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
    requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
    sessionId: request.headers.get('x-session-id') || undefined,
  };
}

/**
 * 🎯 Middleware principal de logging
 */
export function withLogging<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  config: LoggingMiddlewareConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const url = new URL(request.url);

    // Verificar se o path deve ser excluído
    if (finalConfig.excludePaths?.some(path => url.pathname.startsWith(path))) {
      return handler(...args);
    }

    const context = extractRequestContext(request);
    const perfLogger = new PerformanceLogger(
      logger,
      `${request.method} ${url.pathname}`,
      context
    );

    try {
      // 📥 Log da requisição
      if (finalConfig.enableRequestLogging) {
        const requestData: any = {
          url: url.toString(),
          headers: sanitizeData(
            Object.fromEntries(request.headers.entries()),
            finalConfig.sensitiveFields || []
          ),
        };

        // Adicionar body se habilitado
        if (finalConfig.logRequestBody && request.body) {
          try {
            const body = await request.clone().text();
            if (body) {
              requestData.body = sanitizeData(
                JSON.parse(body),
                finalConfig.sensitiveFields || []
              );
            }
          } catch (error) {
            // Body não é JSON válido
            requestData.bodyError = 'Invalid JSON body';
          }
        }

        logger.info('Incoming request', context, requestData);
      }

      // 🔄 Executar handler
      const response = await handler(...args);

      // 📤 Log da resposta
      if (finalConfig.enableResponseLogging) {
        const responseData: any = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        };

        // Adicionar body se habilitado
        if (finalConfig.logResponseBody) {
          try {
            const body = await response.clone().text();
            if (body) {
              responseData.body = JSON.parse(body);
            }
          } catch (error) {
            // Body não é JSON válido
            responseData.bodyError = 'Invalid JSON body';
          }
        }

        const level =
          response.status >= 500
            ? 'error'
            : response.status >= 400
              ? 'warn'
              : 'info';

        if (level === 'error') {
          logger.error(
            'Request completed with error',
            undefined,
            {
              ...context,
              statusCode: response.status,
            },
            responseData
          );
        } else if (level === 'warn') {
          logger.warn(
            'Request completed with warning',
            {
              ...context,
              statusCode: response.status,
            },
            responseData
          );
        } else {
          logger.info(
            'Request completed successfully',
            {
              ...context,
              statusCode: response.status,
            },
            responseData
          );
        }
      }

      // 📊 Log de performance
      if (finalConfig.enablePerformanceLogging) {
        perfLogger.end({
          statusCode: response.status,
          responseSize: response.headers.get('content-length') || 'unknown',
        });
      }

      return response;
    } catch (error) {
      // ❌ Log de erro
      if (finalConfig.enableErrorLogging) {
        logger.error('Request failed with exception', error as Error, context);
      }

      // 📊 Log de performance com erro
      if (finalConfig.enablePerformanceLogging) {
        perfLogger.error(error as Error);
      }

      // Re-throw o erro
      throw error;
    }
  };
}

/**
 * 🎯 Middleware específico para APIs públicas
 */
export function withPublicApiLogging<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return withLogging(handler, {
    logRequestBody: false,
    logResponseBody: false,
    excludePaths: ['/api/health', '/api/metrics', '/api/public/status'],
  });
}

/**
 * 🔐 Middleware específico para APIs autenticadas
 */
export function withAuthenticatedApiLogging<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return withLogging(handler, {
    logRequestBody: true,
    logResponseBody: false,
    sensitiveFields: [
      'password',
      'token',
      'authorization',
      'cookie',
      'cpf',
      'cnpj',
      'telefone',
      'email',
    ],
  });
}

/**
 * 🔧 Middleware específico para APIs administrativas
 */
export function withAdminApiLogging<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return withLogging(handler, {
    logRequestBody: true,
    logResponseBody: true,
    enablePerformanceLogging: true,
    sensitiveFields: [
      'password',
      'token',
      'authorization',
      'cookie',
      'cpf',
      'cnpj',
      'telefone',
      'email',
      'chave_pix',
    ],
  });
}

/**
 * 📊 Middleware para logging de métricas
 */
export function withMetricsLogging<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return withLogging(handler, {
    enableRequestLogging: false,
    enableResponseLogging: false,
    enablePerformanceLogging: true,
    excludePaths: [],
  });
}

/**
 * 🎯 Decorator para logging automático de métodos de classe
 */
export function LogApiMethod(config?: LoggingMiddlewareConfig) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const wrappedMethod = withLogging(originalMethod, config);
    descriptor.value = wrappedMethod;
    return descriptor;
  };
}

/**
 * 📈 Utilitários para logging de operações específicas
 */
export class ApiLogger {
  /**
   * 💾 Log de operação de banco de dados
   */
  static logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    recordsAffected?: number,
    context?: LogContext
  ): void {
    logger.info(`Database operation: ${operation}`, {
      ...context,
      operation,
      table,
      duration,
      recordsAffected,
    });
  }

  /**
   * 🔐 Log de operação de autenticação
   */
  static logAuthOperation(
    operation: 'login' | 'logout' | 'register' | 'password_reset',
    userId?: string,
    success: boolean = true,
    context?: LogContext
  ): void {
    const message = `Auth operation: ${operation} ${success ? 'succeeded' : 'failed'}`;

    if (success) {
      logger.info(message, {
        ...context,
        userId,
        operation,
        success,
      });
    } else {
      logger.warn(message, {
        ...context,
        userId,
        operation,
        success,
      });
    }
  }

  /**
   * 💳 Log de operação de pagamento
   */
  static logPaymentOperation(
    operation: string,
    amount: number,
    currency: string = 'BRL',
    success: boolean = true,
    paymentId?: string,
    context?: LogContext
  ): void {
    const message = `Payment operation: ${operation} ${success ? 'succeeded' : 'failed'}`;

    if (success) {
      logger.info(message, {
        ...context,
        operation,
        amount,
        currency,
        paymentId,
        success,
      });
    } else {
      logger.error(message, undefined, {
        ...context,
        operation,
        amount,
        currency,
        paymentId,
        success,
      });
    }
  }

  /**
   * 📧 Log de operação de comunicação
   */
  static logCommunicationOperation(
    type: 'email' | 'sms' | 'whatsapp' | 'push',
    recipient: string,
    success: boolean = true,
    messageId?: string,
    context?: LogContext
  ): void {
    const message = `Communication sent: ${type} to ${recipient} ${success ? 'succeeded' : 'failed'}`;

    if (success) {
      logger.info(message, {
        ...context,
        type,
        recipient: recipient.replace(/(.{3}).*(.{3})/, '$1***$2'), // Mascarar recipient
        messageId,
        success,
      });
    } else {
      logger.error(message, undefined, {
        ...context,
        type,
        recipient: recipient.replace(/(.{3}).*(.{3})/, '$1***$2'),
        messageId,
        success,
      });
    }
  }
}

export default withLogging;
