/**
 * @jest-environment node
 */

import {
  LogLevel,
  LogContext,
  LogEntry,
  LoggerConfig,
  createLogger,
  logger as defaultLogger,
  createRequestLogger,
  PerformanceLogger,
  LogMethod,
} from '../../../lib/services/logger-service';

describe('lib/services/logger-service', () => {
  describe('Types and Interfaces', () => {
    it('should have LogLevel type with all valid levels', () => {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
      expect(levels.length).toBe(5);
      levels.forEach(level => {
        expect(['debug', 'info', 'warn', 'error', 'fatal']).toContain(level);
      });
    });

    it('should support LogContext with user fields', () => {
      const context: LogContext = {
        userId: 'user-123',
        sessionId: 'session-456',
      };
      expect(context.userId).toBe('user-123');
    });

    it('should support LogContext with request fields', () => {
      const context: LogContext = {
        requestId: 'req-789',
        endpoint: '/api/users',
        method: 'GET',
        statusCode: 200,
        duration: 125,
      };
      expect(context.requestId).toBe('req-789');
      expect(context.statusCode).toBe(200);
    });

    it('should support LogContext with network fields', () => {
      const context: LogContext = {
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1',
      };
      expect(context.ip).toBe('192.168.1.1');
    });

    it('should create LogEntry with required fields', () => {
      const entry: LogEntry = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date().toISOString(),
      };
      expect(entry.level).toBe('info');
      expect(entry.message).toBe('Test message');
    });

    it('should create LogEntry with optional context', () => {
      const entry: LogEntry = {
        level: 'warn',
        message: 'Warning',
        timestamp: new Date().toISOString(),
        context: { userId: 'user-1' },
      };
      expect(entry.context?.userId).toBe('user-1');
    });

    it('should create LogEntry with error information', () => {
      const entry: LogEntry = {
        level: 'error',
        message: 'Error occurred',
        timestamp: new Date().toISOString(),
        error: {
          name: 'TypeError',
          message: 'Cannot read property',
          code: 'ERR_TYPE',
        },
      };
      expect(entry.error?.name).toBe('TypeError');
    });

    it('should support LoggerConfig with all fields', () => {
      const config: LoggerConfig = {
        level: 'info',
        enableConsole: true,
        enableFile: true,
        enableRemote: true,
        remoteEndpoint: 'https://logs.example.com',
        maxFileSize: 10485760,
        maxFiles: 10,
        environment: 'production',
      };
      expect(config.level).toBe('info');
      expect(config.environment).toBe('production');
    });
  });

  describe('createLogger factory', () => {
    it('should create logger with default config', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.fatal).toBe('function');
    });

    it('should create logger with custom config', () => {
      const config: Partial<LoggerConfig> = {
        level: 'warn',
        enableConsole: true,
      };
      const logger = createLogger(config);
      expect(logger).toBeDefined();
    });

    it('should create logger with partial configuration', () => {
      const logger = createLogger({ level: 'debug' });
      expect(logger).toBeDefined();
    });
  });

  describe('Default logger instance', () => {
    it('should export default logger', () => {
      expect(defaultLogger).toBeDefined();
    });

    it('should have debug method', () => {
      expect(typeof defaultLogger.debug).toBe('function');
    });

    it('should have info method', () => {
      expect(typeof defaultLogger.info).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof defaultLogger.warn).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof defaultLogger.error).toBe('function');
    });

    it('should have fatal method', () => {
      expect(typeof defaultLogger.fatal).toBe('function');
    });
  });

  describe('Logging methods', () => {
    const logger = createLogger({ enableConsole: false, enableRemote: false, enableFile: false });

    it('should call debug method', () => {
      expect(() => {
        logger.debug('Debug message');
      }).not.toThrow();
    });

    it('should call debug with context', () => {
      expect(() => {
        logger.debug('Debug message', { userId: 'user-1' });
      }).not.toThrow();
    });

    it('should call debug with context and metadata', () => {
      expect(() => {
        logger.debug('Debug message', { userId: 'user-1' }, { key: 'value' });
      }).not.toThrow();
    });

    it('should call info method', () => {
      expect(() => {
        logger.info('Info message');
      }).not.toThrow();
    });

    it('should call info with context', () => {
      expect(() => {
        logger.info('Info message', { endpoint: '/api/users' });
      }).not.toThrow();
    });

    it('should call warn method', () => {
      expect(() => {
        logger.warn('Warning message');
      }).not.toThrow();
    });

    it('should call warn with context', () => {
      expect(() => {
        logger.warn('Warning', { statusCode: 429 });
      }).not.toThrow();
    });

    it('should call error method', () => {
      expect(() => {
        logger.error('Error message');
      }).not.toThrow();
    });

    it('should call fatal method', () => {
      expect(() => {
        logger.fatal('Fatal message');
      }).not.toThrow();
    });
  });

  describe('createRequestLogger factory', () => {
    it('should create request logger', () => {
      const logger = createLogger();
      const requestLogger = createRequestLogger(logger);
      expect(requestLogger).toBeDefined();
      expect(typeof requestLogger).toBe('function');
    });

    it('should return a function', () => {
      const logger = createLogger();
      const requestLogger = createRequestLogger(logger);
      expect(requestLogger).toBeInstanceOf(Function);
    });
  });

  describe('PerformanceLogger class', () => {
    it('should be a class', () => {
      expect(typeof PerformanceLogger).toBe('function');
    });

    it('should be instantiable', () => {
      const logger = createLogger();
      const perfLogger = new PerformanceLogger(logger, 'test-operation');
      expect(perfLogger).toBeDefined();
    });

    it('should have constructor with operation name', () => {
      const logger = createLogger();
      const perfLogger = new PerformanceLogger(logger, 'database-query');
      expect(perfLogger).toBeDefined();
    });
  });

  describe('LogMethod decorator', () => {
    it('should be a function', () => {
      expect(typeof LogMethod).toBe('function');
    });

    it('should work without parameters', () => {
      const decorator = LogMethod();
      expect(typeof decorator).toBe('function');
    });

    it('should work with operation name', () => {
      const decorator = LogMethod('custom-operation');
      expect(typeof decorator).toBe('function');
    });

    it('should return a decorator function', () => {
      const decorator = LogMethod('test-op');
      expect(typeof decorator).toBe('function');
    });
  });

  describe('Configuration variations', () => {
    it('should create logger for development', () => {
      const config: LoggerConfig = {
        level: 'debug',
        enableConsole: true,
        enableFile: false,
        enableRemote: false,
        environment: 'development',
      };
      const logger = createLogger(config);
      expect(logger).toBeDefined();
    });

    it('should create logger for test environment', () => {
      const config: LoggerConfig = {
        level: 'debug',
        enableConsole: false,
        enableFile: false,
        enableRemote: false,
        environment: 'test',
      };
      const logger = createLogger(config);
      expect(logger).toBeDefined();
    });

    it('should create logger for production', () => {
      const config: LoggerConfig = {
        level: 'warn',
        enableConsole: false,
        enableFile: true,
        enableRemote: true,
        remoteEndpoint: 'https://logs.example.com',
        environment: 'production',
      };
      const logger = createLogger(config);
      expect(logger).toBeDefined();
    });

    it('should support all log levels', () => {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
      levels.forEach(level => {
        const config: LoggerConfig = {
          level,
          enableConsole: false,
          enableFile: false,
          enableRemote: false,
          environment: 'test',
        };
        const logger = createLogger(config);
        expect(logger).toBeDefined();
      });
    });

    it('should support console output', () => {
      const config: LoggerConfig = {
        level: 'debug',
        enableConsole: true,
        enableFile: false,
        enableRemote: false,
        environment: 'test',
      };
      const logger = createLogger(config);
      expect(logger).toBeDefined();
    });

    it('should support file output', () => {
      const config: LoggerConfig = {
        level: 'debug',
        enableConsole: false,
        enableFile: true,
        maxFileSize: 10485760,
        maxFiles: 10,
        enableRemote: false,
        environment: 'test',
      };
      const logger = createLogger(config);
      expect(logger).toBeDefined();
    });

    it('should support remote output', () => {
      const config: LoggerConfig = {
        level: 'debug',
        enableConsole: false,
        enableFile: false,
        enableRemote: true,
        remoteEndpoint: 'https://logs.example.com/api/logs',
        environment: 'test',
      };
      const logger = createLogger(config);
      expect(logger).toBeDefined();
    });

    it('should support multiple output destinations', () => {
      const config: LoggerConfig = {
        level: 'debug',
        enableConsole: true,
        enableFile: true,
        enableRemote: true,
        remoteEndpoint: 'https://logs.example.com',
        maxFileSize: 10485760,
        environment: 'test',
      };
      const logger = createLogger(config);
      expect(logger).toBeDefined();
    });
  });

  describe('Context handling', () => {
    const logger = createLogger({ enableConsole: false, enableRemote: false, enableFile: false });

    it('should accept full context', () => {
      const context: LogContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        requestId: 'req-789',
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1',
        endpoint: '/api/endpoint',
        method: 'POST',
        statusCode: 201,
        duration: 150,
      };
      expect(() => {
        logger.info('Request processed', context);
      }).not.toThrow();
    });

    it('should accept partial context', () => {
      const context: LogContext = {
        userId: 'user-123',
        requestId: 'req-789',
      };
      expect(() => {
        logger.info('Partial context', context);
      }).not.toThrow();
    });

    it('should accept custom context fields', () => {
      const context: LogContext = {
        userId: 'user-1',
        customField: 'custom-value',
      };
      expect(context.customField).toBe('custom-value');
    });
  });

  describe('Metadata patterns', () => {
    const logger = createLogger({ enableConsole: false, enableRemote: false, enableFile: false });

    it('should accept metadata object', () => {
      const metadata = {
        userId: 'user-1',
        action: 'create',
        timestamp: Date.now(),
      };
      expect(() => {
        logger.info('Action performed', undefined, metadata);
      }).not.toThrow();
    });

    it('should accept nested metadata', () => {
      const metadata = {
        user: { id: '1', name: 'John' },
        operation: { type: 'read', duration: 100 },
      };
      expect(() => {
        logger.info('Operation completed', undefined, metadata);
      }).not.toThrow();
    });

    it('should accept large metadata', () => {
      const metadata: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        metadata[`field_${i}`] = `value_${i}`;
      }
      expect(() => {
        logger.info('Large payload', undefined, metadata);
      }).not.toThrow();
    });
  });

  describe('Export validation', () => {
    it('should export LoggerConfig type', () => {
      const config: LoggerConfig = {
        level: 'info',
        enableConsole: true,
        enableFile: false,
        enableRemote: false,
        environment: 'test',
      };
      expect(config).toBeDefined();
    });

    it('should export createLogger function', () => {
      expect(typeof createLogger).toBe('function');
    });

    it('should export default logger instance', () => {
      expect(defaultLogger).toBeDefined();
    });

    it('should export createRequestLogger function', () => {
      expect(typeof createRequestLogger).toBe('function');
    });

    it('should export PerformanceLogger class', () => {
      expect(typeof PerformanceLogger).toBe('function');
    });

    it('should export LogMethod decorator', () => {
      expect(typeof LogMethod).toBe('function');
    });
  });
});
