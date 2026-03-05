/**
 * @jest-environment node
 */

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    clientSession: {
      findFirst: jest.fn(),
    },
  },
}));

import { NextRequest } from 'next/server';
import {
  verifyClienteToken,
  requireClienteAuth,
  type ClienteAuth,
} from '../../../lib/auth/client-middleware';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const mockVerify = verify as jest.Mock;
const mockPrisma = prisma as unknown as {
  clientSession: {
    findFirst: jest.Mock;
  };
};

describe('lib/auth/client-middleware - Cliente Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    mockPrisma.clientSession.findFirst.mockResolvedValue({ id: 'session-123' });
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
        'test-jwt-secret',
        { algorithms: ['HS256'] }
      );
      expect(mockPrisma.clientSession.findFirst).not.toHaveBeenCalled();
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
      expect(mockPrisma.clientSession.findFirst).not.toHaveBeenCalled();
    });

    it('should return decoded token when token is valid and tipo is cliente', async () => {
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

      const result = await verifyClienteToken(mockRequest);

      expect(result).toEqual(decodedPayload);
      expect(mockPrisma.clientSession.findFirst).toHaveBeenCalledTimes(1);
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
        'dev-local-only-jwt-secret-change-me',
        { algorithms: ['HS256'] }
      );
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

      const result = await requireClienteAuth(mockRequest);

      expect(result).toEqual(decodedPayload);
      expect(result).not.toHaveProperty('status');
    });
  });
});
