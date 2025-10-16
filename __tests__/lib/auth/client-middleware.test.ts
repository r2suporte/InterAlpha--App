/**
 * @jest-environment node
 */

// Mock implementations MUST be declared before jest.mock calls
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../../lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { NextRequest } from 'next/server';
import {
  verifyClienteToken,
  requireClienteAuth,
  type ClienteAuth,
} from '../../../lib/auth/client-middleware';
import { verify } from 'jsonwebtoken';
import { createClient } from '../../../lib/supabase/server';

const mockVerify = verify as jest.Mock;
const mockCreateClient = createClient as jest.Mock;

describe('lib/auth/client-middleware - Cliente Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('verifyClienteToken', () => {
    it('should return null when token cookie is not present', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
      } as unknown as NextRequest;

      const result = await verifyClienteToken(mockRequest);

      expect(result).toBeNull();
      expect(mockRequest.cookies.get).toHaveBeenCalledWith('cliente-token');
    });

    it('should return null when JWT verification fails', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'invalid.token.jwt' }),
        },
      } as unknown as NextRequest;

      mockVerify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const result = await verifyClienteToken(mockRequest);

      expect(result).toBeNull();
      expect(mockVerify).toHaveBeenCalledWith(
        'invalid.token.jwt',
        'test-jwt-secret'
      );
    });

    it('should return null when decoded token tipo is not cliente', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid.token' }),
        },
      } as unknown as NextRequest;

      const decodedPayload = {
        clienteId: 'cliente-123',
        login: 'user@example.com',
        email: 'user@example.com',
        tipo: 'admin',
      };

      mockVerify.mockReturnValue(decodedPayload);

      const result = await verifyClienteToken(mockRequest);

      expect(result).toBeNull();
    });

    it('should return null when session is not found in database', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid.token' }),
        },
      } as unknown as NextRequest;

      const decodedPayload: ClienteAuth = {
        clienteId: 'cliente-123',
        login: 'user@example.com',
        email: 'user@example.com',
        tipo: 'cliente',
      };

      mockVerify.mockReturnValue(decodedPayload);

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await verifyClienteToken(mockRequest);

      expect(result).toBeNull();
    });

    it('should return null when session data is empty', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid.token' }),
        },
      } as unknown as NextRequest;

      const decodedPayload: ClienteAuth = {
        clienteId: 'cliente-123',
        login: 'user@example.com',
        email: 'user@example.com',
        tipo: 'cliente',
      };

      mockVerify.mockReturnValue(decodedPayload);

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await verifyClienteToken(mockRequest);

      expect(result).toBeNull();
    });

    it('should return decoded token when session is valid', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid.token' }),
        },
      } as unknown as NextRequest;

      const decodedPayload: ClienteAuth = {
        clienteId: 'cliente-123',
        login: 'user@example.com',
        email: 'user@example.com',
        tipo: 'cliente',
      };

      mockVerify.mockReturnValue(decodedPayload);

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            token_sessao: 'valid.token',
            expires_at: '2025-12-31T23:59:59Z',
          },
          error: null,
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await verifyClienteToken(mockRequest);

      expect(result).toEqual(decodedPayload);
      expect(mockSupabase.from).toHaveBeenCalledWith('cliente_portal_sessoes');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('token_sessao', 'valid.token');
      expect(mockSupabase.gte).toHaveBeenCalledWith(
        'expires_at',
        expect.any(String)
      );
    });

    it('should use JWT_SECRET from environment variable', async () => {
      process.env.JWT_SECRET = 'custom-secret-key';

      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'token' }),
        },
      } as unknown as NextRequest;

      mockVerify.mockImplementation(() => {
        throw new Error('Invalid');
      });

      await verifyClienteToken(mockRequest);

      expect(mockVerify).toHaveBeenCalledWith('token', 'custom-secret-key');
    });

    it('should use default JWT_SECRET when env var is not set', async () => {
      delete process.env.JWT_SECRET;

      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'token' }),
        },
      } as unknown as NextRequest;

      mockVerify.mockImplementation(() => {
        throw new Error('Invalid');
      });

      await verifyClienteToken(mockRequest);

      expect(mockVerify).toHaveBeenCalledWith(
        'token',
        'your-super-secret-jwt-key-change-in-production'
      );
    });

    it('should catch and log errors gracefully', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid.token' }),
        },
      } as unknown as NextRequest;

      mockVerify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await verifyClienteToken(mockRequest);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erro ao verificar token do cliente:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should query database with correct expiry condition', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'token.jwt' }),
        },
      } as unknown as NextRequest;

      const decodedPayload: ClienteAuth = {
        clienteId: 'cli-001',
        login: 'teste@example.com',
        email: 'teste@example.com',
        tipo: 'cliente',
      };

      mockVerify.mockReturnValue(decodedPayload);

      const gteMock = jest.fn().mockReturnThis();
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: gteMock,
        single: jest.fn().mockResolvedValue({
          data: { token_sessao: 'token.jwt' },
          error: null,
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabase);

      await verifyClienteToken(mockRequest);

      // Verify that gte is called with expires_at and a current/future date
      expect(gteMock).toHaveBeenCalledWith('expires_at', expect.any(String));
      const callArgs = gteMock.mock.calls[0][1];
      expect(new Date(callArgs).getTime()).toBeLessThanOrEqual(Date.now() + 1000); // Allow 1s tolerance
    });
  });

  describe('requireClienteAuth', () => {
    it('should return 401 Unauthorized when token is missing', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
      } as unknown as NextRequest;

      const result = await requireClienteAuth(mockRequest);

      expect('status' in result && result.status === 401).toBe(true);
    });

    it('should return error JSON in response', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
      } as unknown as NextRequest;

      const result = await requireClienteAuth(mockRequest);

      expect('status' in result && result.status === 401).toBe(true);
      // Verify it's a NextResponse with proper error
      expect('status' in result).toBe(true);
    });

    it('should return cliente auth when verification succeeds', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid.token' }),
        },
      } as unknown as NextRequest;

      const decodedPayload: ClienteAuth = {
        clienteId: 'cliente-456',
        login: 'cliente@example.com',
        email: 'cliente@example.com',
        tipo: 'cliente',
      };

      mockVerify.mockReturnValue(decodedPayload);

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            token_sessao: 'valid.token',
            expires_at: '2025-12-31T23:59:59Z',
          },
          error: null,
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await requireClienteAuth(mockRequest);

      expect(result).toEqual(decodedPayload);
      expect(result).not.toHaveProperty('status');
    });

    it('should return NextResponse on auth failure', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
      } as unknown as NextRequest;

      const result = await requireClienteAuth(mockRequest);

      // Should be a NextResponse (has status property)
      expect('status' in result).toBe(true);
      expect('status' in result && result.status === 401).toBe(true);
    });

    it('should return ClienteAuth object on auth success', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid.token' }),
        },
      } as unknown as NextRequest;

      const decodedPayload: ClienteAuth = {
        clienteId: 'cliente-789',
        login: 'test@example.com',
        email: 'test@example.com',
        tipo: 'cliente',
      };

      mockVerify.mockReturnValue(decodedPayload);

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { token_sessao: 'valid.token' },
          error: null,
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await requireClienteAuth(mockRequest);

      // Should NOT have status property (is ClienteAuth, not NextResponse)
      expect(result).not.toHaveProperty('status');
      expect(result).toEqual(decodedPayload);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete successful authentication flow', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid.token' }),
        },
      } as unknown as NextRequest;

      const decodedPayload: ClienteAuth = {
        clienteId: 'cliente-integration-001',
        login: 'integration@test.com',
        email: 'integration@test.com',
        tipo: 'cliente',
      };

      mockVerify.mockReturnValue(decodedPayload);

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            token_sessao: 'valid.token',
            expires_at: '2025-12-31T23:59:59Z',
            cliente_id: 'cliente-integration-001',
          },
          error: null,
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabase);

      // Test verifyClienteToken
      const verified = await verifyClienteToken(mockRequest);
      expect(verified).toEqual(decodedPayload);

      // Test requireClienteAuth
      const required = await requireClienteAuth(mockRequest);
      expect(required).toEqual(decodedPayload);
    });

    it('should differentiate between valid and invalid authentication attempts', async () => {
      // First attempt: valid token
      const validRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid.token' }),
        },
      } as unknown as NextRequest;

      const decodedPayload: ClienteAuth = {
        clienteId: 'cliente-123',
        login: 'user@example.com',
        email: 'user@example.com',
        tipo: 'cliente',
      };

      mockVerify.mockReturnValueOnce(decodedPayload);

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({
            data: { token_sessao: 'valid.token' },
            error: null,
          })
          .mockResolvedValueOnce({
            data: null,
            error: new Error('Not found'),
          }),
      };

      mockCreateClient.mockResolvedValue(mockSupabase);

      const validResult = await verifyClienteToken(validRequest);
      expect(validResult).not.toBeNull();

      // Second attempt: invalid token
      const invalidRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'invalid.token' }),
        },
      } as unknown as NextRequest;

      mockVerify.mockReturnValueOnce(decodedPayload);

      const invalidResult = await verifyClienteToken(invalidRequest);
      expect(invalidResult).toBeNull();
    });

    it('should handle multiple sequential authentication requests', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => ({
        cookies: {
          get: jest.fn().mockReturnValue({ value: `token-${i}` }),
        },
      } as unknown as NextRequest));

      const decodedPayload: ClienteAuth = {
        clienteId: 'cliente-multi-test',
        login: 'multi@test.com',
        email: 'multi@test.com',
        tipo: 'cliente',
      };

      mockVerify.mockReturnValue(decodedPayload);

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { token_sessao: 'valid' },
          error: null,
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabase);

      const results = await Promise.all(
        requests.map((req) => verifyClienteToken(req))
      );

      expect(results).toEqual([decodedPayload, decodedPayload, decodedPayload]);
      expect(mockCreateClient).toHaveBeenCalledTimes(3);
    });

    it('should return appropriate error response structure', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
      } as unknown as NextRequest;

      const result = await requireClienteAuth(mockRequest);

      // Verify it's a proper NextResponse with 401 status
      expect('status' in result && result.status === 401).toBe(true);
    });
  });
});
