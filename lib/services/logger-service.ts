/**
 * 📝 Logger Service - Sistema de logging estruturado
 *
 * Este serviço fornece logging estruturado com diferentes níveis,
 * contexto, métricas e integração com sistemas de monitoramento.
 */

// 📊 Tipos de log
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// 🏷️ Interface para contexto do log
export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

// 📋 Interface para entrada de log
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, unknown>;
}

// 🎯 Interface para configuração do logger
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxFileSize?: number;
  maxFiles?: number;
  environment: 'development' | 'test' | 'production';
}

/**
 * 🏗️ Logger Service - Serviço principal de logging
 */
export class LoggerService {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private bufferSize = 100;
  private flushInterval = 5000; // 5 segundos
  private flushTimer?: ReturnType<typeof setTimeout>;

  // 📊 Níveis de log em ordem de prioridade
  private static readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor(config: LoggerConfig) {
    this.config = config;
    this.startFlushTimer();
  }

  /**
   * 🔍 Debug - Informações detalhadas para desenvolvimento
   */
  debug(
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    this.log('debug', message, context, undefined, metadata);
  }

  /**
   * ℹ️ Info - Informações gerais do sistema
   */
  info(
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    this.log('info', message, context, undefined, metadata);
  }

  /**
   * ⚠️ Warn - Avisos que não impedem o funcionamento
   */
  warn(
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    this.log('warn', message, context, undefined, metadata);
  }

  /**
   * ❌ Error - Erros que afetam funcionalidades
   */
  error(
    message: string,
    error?: Error,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    const errorWithCode = error as Error & { code?: string };
    const errorInfo = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: errorWithCode.code,
        }
      : undefined;

    this.log('error', message, context, errorInfo, metadata);
  }

  /**
   * 💀 Fatal - Erros críticos que podem parar o sistema
   */
  fatal(
    message: string,
    error?: Error,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    const errorWithCode = error as Error & { code?: string };
    const errorInfo = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: errorWithCode.code,
        }
      : undefined;

    this.log('fatal', message, context, errorInfo, metadata);
  }

  /**
   * 📝 Log principal - Método interno para processar logs
   */
  protected log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: LogEntry['error'],
    metadata?: Record<string, unknown>
  ): void {
    // Verificar se o nível está habilitado
    if (
      LoggerService.LOG_LEVELS[level] <
      LoggerService.LOG_LEVELS[this.config.level]
    ) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      metadata,
    };

    // Adicionar ao buffer
    this.logBuffer.push(logEntry);

    // Console log imediato para desenvolvimento
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Flush imediato para erros críticos
    if (level === 'error' || level === 'fatal') {
      this.flush();
    }

    // Flush se buffer estiver cheio
    if (this.logBuffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  /**
   * 🖥️ Log para console com formatação
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, timestamp, context, error, metadata } = entry;

    // Cores para diferentes níveis
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const color = colors[level] || '';

    // Formatação básica
    let logMessage = `${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`;

    // Adicionar contexto se disponível
    if (context && Object.keys(context).length > 0) {
      logMessage += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }

    // Adicionar erro se disponível
    if (error) {
      logMessage += `\n  Error: ${error.name}: ${error.message}`;
      if (error.stack && this.config.environment === 'development') {
        logMessage += `\n  Stack: ${error.stack}`;
      }
    }

    // Adicionar metadata se disponível
    if (metadata && Object.keys(metadata).length > 0) {
      logMessage += `\n  Metadata: ${JSON.stringify(metadata, null, 2)}`;
    }

    console.log(logMessage);
  }

  /**
   * 💾 Flush - Enviar logs em buffer para destinos
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Enviar para arquivo (se habilitado)
      if (this.config.enableFile) {
        await this.writeToFile(logsToFlush);
      }

      // Enviar para endpoint remoto (se habilitado)
      if (this.config.enableRemote && this.config.remoteEndpoint) {
        await this.sendToRemote(logsToFlush);
      }
    } catch (error) {
      console.error('Erro ao fazer flush dos logs:', error);
      // Recolocar logs no buffer em caso de erro
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  /**
   * 📁 Escrever logs em arquivo
   */
  private async writeToFile(logs: LogEntry[]): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(
        logDir,
        `app-${new Date().toISOString().split('T')[0]}.log`
      );

      // Criar diretório se não existir
      try {
        await fs.mkdir(logDir, { recursive: true });
      } catch (error) {
        // Diretório já existe
      }

      // Formatar logs para arquivo
      const logLines = `${logs.map(log => JSON.stringify(log)).join('\n')  }\n`;

      // Escrever no arquivo
      await fs.appendFile(logFile, logLines);
    } catch (error) {
      console.error('Erro ao escrever logs em arquivo:', error);
    }
  }

  /**
   * 🌐 Enviar logs para endpoint remoto
   */
  private async sendToRemote(logs: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao enviar logs para endpoint remoto:', error);
      throw error;
    }
  }

  /**
   * ⏰ Iniciar timer de flush automático
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * 🛑 Parar timer e fazer flush final
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }

  /**
   * 📊 Obter estatísticas do logger
   */
  getStats(): {
    bufferSize: number;
    config: LoggerConfig;
    uptime: number;
  } {
    return {
      bufferSize: this.logBuffer.length,
      config: this.config,
      uptime: process.uptime(),
    };
  }
}

/**
 * 🏭 Factory para criar instâncias do logger
 */
export function createLogger(config?: Partial<LoggerConfig>): LoggerService {
  const defaultConfig: LoggerConfig = {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production',
    enableRemote: false,
    remoteEndpoint: process.env.LOG_REMOTE_ENDPOINT,
    environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  };

  return new LoggerService({ ...defaultConfig, ...config });
}

/**
 * 🌟 Instância global do logger
 */
export const logger = createLogger();

/**
 * 🎯 Middleware para logging de requisições HTTP
 */
export function createRequestLogger(logger: LoggerService) {
  return function logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Partial<LogContext>
  ) {
    const level: LogLevel =
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const message = `${method} ${url} - ${statusCode}`;
    const requestContext = {
      method,
      endpoint: url,
      statusCode,
      duration,
      ...context,
    };

    // Usar métodos públicos baseados no nível
    switch (level) {
      case 'error':
        logger.error(message, undefined, requestContext);
        break;
      case 'warn':
        logger.warn(message, requestContext);
        break;
      default:
        logger.info(message, requestContext);
        break;
    }
  };
}

/**
 * 📈 Utilitários para logging de performance
 */
export class PerformanceLogger {
  private startTime: number;
  private logger: LoggerService;
  private operation: string;
  private context?: LogContext;

  constructor(logger: LoggerService, operation: string, context?: LogContext) {
    this.logger = logger;
    this.operation = operation;
    this.context = context;
    this.startTime = performance.now();
  }

  /**
   * ✅ Finalizar medição com sucesso
   */
  end(metadata?: Record<string, unknown>): void {
    const duration = performance.now() - this.startTime;

    this.logger.info(
      `${this.operation} completed`,
      {
        ...this.context,
        duration: Math.round(duration * 100) / 100, // 2 casas decimais
      },
      metadata
    );
  }

  /**
   * ❌ Finalizar medição com erro
   */
  error(error: Error, metadata?: Record<string, unknown>): void {
    const duration = performance.now() - this.startTime;

    this.logger.error(
      `${this.operation} failed`,
      error,
      {
        ...this.context,
        duration: Math.round(duration * 100) / 100,
      },
      metadata
    );
  }
}

/**
 * 🎯 Decorator para logging automático de métodos
 */
export function LogMethod(operation?: string) {
  return function (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const operationName =
      operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const perfLogger = new PerformanceLogger(logger, operationName);

      try {
        const result = await (originalMethod as (...a: unknown[]) => Promise<unknown>).apply(this, args);
        perfLogger.end();
        return result;
      } catch (error) {
        perfLogger.error(error as Error);
        throw error;
      }
    } as unknown as (...a: unknown[]) => Promise<unknown>;

    return descriptor;
  };
}

export default LoggerService;
