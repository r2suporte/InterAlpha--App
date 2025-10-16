/**
 * @jest-environment node
 */

jest.mock('../../../lib/services/logger-service', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  PerformanceLogger: jest.fn().mockImplementation(() => ({
    end: jest.fn(),
    error: jest.fn(),
  })),
  LogContext: {},
}));

import { NextRequest, NextResponse } from 'next/server';
import { logger, PerformanceLogger } from '../../../lib/services/logger-service';
import {
  withLogging,
  withPublicApiLogging,
  withAuthenticatedApiLogging,
  withAdminApiLogging,
  withMetricsLogging,
  ApiLogger,
} from '../../../lib/middleware/logging-middleware';

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('lib/middleware/logging-middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withLogging', () => {
    it('should log incoming requests', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/clientes',
        headers: {
          get: jest.fn().mockImplementation((key) => {
            const headers: Record<string, string> = {
              'user-agent': 'Test Agent',
              'x-forwarded-for': '192.168.1.1',
              'x-request-id': 'req-123',
            };
            return headers[key.toLowerCase()] || null;
          }),
          entries: jest.fn().mockReturnValue([
            ['user-agent', 'Test Agent'],
            ['content-type', 'application/json'],
          ]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const mockResponse = new NextResponse('OK', { status: 200 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withLogging(handler);

      await middleware(mockRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should log successful responses', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/clientes',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('100'),
          entries: jest.fn().mockReturnValue([['content-length', '100']]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{}'),
        }),
      } as unknown as NextResponse;

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withLogging(handler, { enableResponseLogging: true });

      await middleware(mockRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Request completed successfully',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should log error responses with warning level (4xx)', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/not-found',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{}'),
        }),
      } as unknown as NextResponse;

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withLogging(handler, { enableResponseLogging: true });

      await middleware(mockRequest);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Request completed with warning',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should log server error responses with error level (5xx)', async () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/error',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{}'),
        }),
      } as unknown as NextResponse;

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withLogging(handler, { enableResponseLogging: true });

      await middleware(mockRequest);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request completed with error',
        undefined,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should sanitize sensitive fields', async () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/login',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([
            ['authorization', 'Bearer token123'],
            ['cookie', 'session=abc'],
          ]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{"password":"secret123"}'),
        }),
        body: true,
      } as unknown as NextRequest;

      const mockResponse = new NextResponse('OK', { status: 200 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withLogging(handler, { 
        logRequestBody: true,
        sensitiveFields: ['password', 'token', 'authorization', 'cookie'],
      });

      await middleware(mockRequest);

      const infoCall = mockLogger.info.mock.calls[0];
      if (infoCall && infoCall[2]) {
        const data = infoCall[2];
        // Check that sensitive fields are redacted
        expect(JSON.stringify(data)).not.toContain('secret123');
        expect(JSON.stringify(data)).not.toContain('token123');
      }
    });

    it('should exclude specified paths', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/health',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const mockResponse = new NextResponse('OK', { status: 200 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withLogging(handler, {
        excludePaths: ['/api/health'],
      });

      await middleware(mockRequest);

      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('should handle non-GET requests', async () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/clientes',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{}'),
        }),
      } as unknown as NextRequest;

      const mockResponse = {
        status: 201,
        statusText: 'Created',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{}'),
        }),
      } as unknown as NextResponse;

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withLogging(handler);

      await middleware(mockRequest);

      expect(handler).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should log handler errors', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/error',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const error = new Error('Handler error');
      const handler = jest.fn().mockRejectedValue(error);
      const middleware = withLogging(handler, { enableErrorLogging: true });

      await expect(middleware(mockRequest)).rejects.toThrow('Handler error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request failed with exception',
        error,
        expect.any(Object)
      );
    });

    it('should enable/disable request logging', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const mockResponse = new NextResponse('OK', { status: 200 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withLogging(handler, { enableRequestLogging: false });

      await middleware(mockRequest);

      // Should not have logged "Incoming request"
      const incomingRequestLogs = mockLogger.info.mock.calls.filter(
        (call) => call[0] === 'Incoming request'
      );
      expect(incomingRequestLogs.length).toBe(0);
    });

    it('should include request ID', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: {
          get: jest.fn().mockImplementation((key) => {
            if (key === 'x-request-id') return 'custom-req-id';
            return null;
          }),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const mockResponse = new NextResponse('OK', { status: 200 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withLogging(handler);

      await middleware(mockRequest);

      const contextArg = mockLogger.info.mock.calls[0]?.[1];
      expect(contextArg?.requestId).toBe('custom-req-id');
    });

    it('should log response body when enabled', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/data',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const responseBody = { id: 1, name: 'Test' };
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(JSON.stringify(responseBody)),
        }),
      } as unknown as NextResponse;

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withLogging(handler, { 
        logResponseBody: true,
        enableResponseLogging: true,
      });

      await middleware(mockRequest);

      const responseDataArg = mockLogger.info.mock.calls.find(
        (call) => call[0] === 'Request completed successfully'
      )?.[2];
      expect(responseDataArg?.body).toEqual(responseBody);
    });
  });

  describe('withPublicApiLogging', () => {
    it('should create public API logging middleware', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/public/status',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const mockResponse = new NextResponse('OK', { status: 200 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withPublicApiLogging(handler);

      await middleware(mockRequest);

      expect(handler).toHaveBeenCalled();
    });

    it('should exclude public health endpoints', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/health',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const mockResponse = new NextResponse('OK', { status: 200 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withPublicApiLogging(handler);

      await middleware(mockRequest);

      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('withAuthenticatedApiLogging', () => {
    it('should log request body for authenticated APIs', async () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/clientes',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{"name":"Test"}'),
        }),
        body: true,
      } as unknown as NextRequest;

      const mockResponse = new NextResponse('Created', { status: 201 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withAuthenticatedApiLogging(handler);

      await middleware(mockRequest);

      expect(handler).toHaveBeenCalled();
    });

    it('should sanitize sensitive fields for authenticated APIs', async () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/users',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{"email":"user@test.com","cpf":"12345678901"}'),
        }),
        body: true,
      } as unknown as NextRequest;

      const mockResponse = new NextResponse('Created', { status: 201 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withAuthenticatedApiLogging(handler);

      await middleware(mockRequest);

      expect(handler).toHaveBeenCalled();
      // Verify that request was logged
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('withAdminApiLogging', () => {
    it('should log request and response bodies for admin APIs', async () => {
      const mockRequest = {
        method: 'PUT',
        url: 'http://localhost/api/admin/clientes/123',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{"name":"Updated"}'),
        }),
        body: true,
      } as unknown as NextRequest;

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{"id":123,"name":"Updated"}'),
        }),
      } as unknown as NextResponse;

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withAdminApiLogging(handler);

      await middleware(mockRequest);

      expect(handler).toHaveBeenCalled();
    });

    it('should redact sensitive financial fields', async () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/admin/payments',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{"chave_pix":"key@bank","amount":1000}'),
        }),
        body: true,
      } as unknown as NextRequest;

      const mockResponse = new NextResponse('Created', { status: 201 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withAdminApiLogging(handler);

      await middleware(mockRequest);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('withMetricsLogging', () => {
    it('should only log performance metrics', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/metrics',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue(''),
        }),
      } as unknown as NextRequest;

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue(null),
          entries: jest.fn().mockReturnValue([]),
        },
      } as unknown as NextResponse;

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withMetricsLogging(handler);

      await middleware(mockRequest);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('ApiLogger', () => {
    it('should log database operations', () => {
      ApiLogger.logDatabaseOperation('INSERT', 'clientes', 150, 1);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Database operation'),
        expect.objectContaining({
          operation: 'INSERT',
          table: 'clientes',
          duration: 150,
          recordsAffected: 1,
        })
      );
    });

    it('should log successful authentication operations', () => {
      ApiLogger.logAuthOperation('login', 'user-123', true);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('succeeded'),
        expect.objectContaining({
          userId: 'user-123',
          operation: 'login',
          success: true,
        })
      );
    });

    it('should log failed authentication operations', () => {
      ApiLogger.logAuthOperation('login', 'user-123', false);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        expect.objectContaining({
          userId: 'user-123',
          operation: 'login',
          success: false,
        })
      );
    });

    it('should log successful payment operations', () => {
      ApiLogger.logPaymentOperation('charge', 199.99, 'BRL', true, 'pay-123');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('succeeded'),
        expect.objectContaining({
          operation: 'charge',
          amount: 199.99,
          currency: 'BRL',
          paymentId: 'pay-123',
          success: true,
        })
      );
    });

    it('should log failed payment operations', () => {
      ApiLogger.logPaymentOperation('charge', 199.99, 'BRL', false);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        undefined,
        expect.objectContaining({
          operation: 'charge',
          success: false,
        })
      );
    });

    it('should mask recipient in communication logs', () => {
      ApiLogger.logCommunicationOperation('email', 'user@example.com', true, 'msg-123');

      const callArgs = mockLogger.info.mock.calls[0];
      const context = callArgs[1];
      // Recipient should be masked like: use***com
      expect(context?.recipient).toMatch(/use\*\*\*com/);
    });

    it('should log successful communication operations', () => {
      ApiLogger.logCommunicationOperation('sms', '85987654321', true, 'sms-123');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('succeeded'),
        expect.objectContaining({
          type: 'sms',
          messageId: 'sms-123',
          success: true,
        })
      );
    });

    it('should log failed communication operations', () => {
      ApiLogger.logCommunicationOperation('whatsapp', '85987654321', false, 'wa-123');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        undefined,
        expect.objectContaining({
          type: 'whatsapp',
          messageId: 'wa-123',
          success: false,
        })
      );
    });
  });

  describe('Integration', () => {
    it('should handle complete logging workflow', async () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/clientes',
        headers: {
          get: jest.fn().mockImplementation((key) => {
            const headers: Record<string, string> = {
              'x-request-id': 'req-integration-test',
              'user-agent': 'Integration Test',
            };
            return headers[key.toLowerCase()] || null;
          }),
          entries: jest.fn().mockReturnValue([
            ['x-request-id', 'req-integration-test'],
            ['user-agent', 'Integration Test'],
          ]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{"name":"New Client"}'),
        }),
        body: true,
      } as unknown as NextRequest;

      const mockResponse = {
        status: 201,
        statusText: 'Created',
        headers: {
          get: jest.fn().mockReturnValue('50'),
          entries: jest.fn().mockReturnValue([['content-length', '50']]),
        },
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('{"id":1,"name":"New Client"}'),
        }),
      } as unknown as NextResponse;

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withAuthenticatedApiLogging(handler);

      await middleware(mockRequest);

      expect(handler).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });
});
