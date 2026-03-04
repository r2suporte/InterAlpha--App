/**
 * @jest-environment node
 */

const mockCookies = jest.fn();
const mockVerifyJWT = jest.fn();

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};
function getMockPrisma(): PrismaMock {
  return (globalThis as unknown as { __roleMiddlewarePrisma?: PrismaMock })
    .__roleMiddlewarePrisma as PrismaMock;
}

jest.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}));

jest.mock('../../../lib/auth/jwt', () => ({
  verifyJWT: (...args: unknown[]) => mockVerifyJWT(...args),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => {
    const prismaMock: PrismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    (
      globalThis as unknown as {
        __roleMiddlewarePrisma?: PrismaMock;
      }
    ).__roleMiddlewarePrisma = prismaMock;
    return prismaMock;
  }),
}));

import { NextRequest, NextResponse } from 'next/server';
import {
  checkRolePermission,
  createRoleMiddleware,
  canUserAccessRoute,
  getPermissionDebugInfo,
  ROUTE_PERMISSIONS,
  type AuthenticatedUser,
} from '../../../lib/auth/role-middleware';

describe('lib/auth/role-middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });
  });

  describe('ROUTE_PERMISSIONS', () => {
    it('should have resource route permissions', () => {
      expect(ROUTE_PERMISSIONS['/api/clientes']).toBeDefined();
      expect(ROUTE_PERMISSIONS['/api/ordens-servico']).toBeDefined();
    });
  });

  describe('checkRolePermission', () => {
    it('returns unauthenticated when token is missing', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
      } as unknown as NextRequest;

      const result = await checkRolePermission(mockRequest);
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Token não fornecido');
    });

    it('authenticates with valid Bearer token', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue('Bearer valid.token') },
      } as unknown as NextRequest;

      mockVerifyJWT.mockResolvedValue({
        userId: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
      });

      getMockPrisma().user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
      });

      const result = await checkRolePermission(mockRequest);
      expect(result.authenticated).toBe(true);
      expect(result.user?.id).toBe('user-1');
    });

    it('returns internal auth error for invalid token', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue('Bearer invalid') },
      } as unknown as NextRequest;

      mockVerifyJWT.mockRejectedValue(new Error('invalid token'));

      const result = await checkRolePermission(mockRequest);
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Erro interno na autenticação');
    });

    it('creates local user when payload is valid and user does not exist', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue('Bearer valid.token') },
      } as unknown as NextRequest;

      mockVerifyJWT.mockResolvedValue({
        userId: 'user-2',
        email: 'new@test.com',
        role: 'user',
      });

      getMockPrisma().user.findUnique.mockResolvedValue(null);
      getMockPrisma().user.create.mockResolvedValue({
        id: 'user-2',
        email: 'new@test.com',
        name: 'new',
        role: 'user',
      });

      const result = await checkRolePermission(mockRequest);
      expect(result.authenticated).toBe(true);
      expect(getMockPrisma().user.create).toHaveBeenCalled();
    });

    it('returns invalid role error when role is not allowed', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue('Bearer valid.token') },
      } as unknown as NextRequest;

      mockVerifyJWT.mockResolvedValue({
        userId: 'user-3',
        email: 'bad@test.com',
        role: 'invalid',
      });

      getMockPrisma().user.findUnique.mockResolvedValue({
        id: 'user-3',
        email: 'bad@test.com',
        name: 'Bad',
        role: 'invalid',
      });

      const result = await checkRolePermission(mockRequest);
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Role do usuário inválida');
    });
  });

  describe('createRoleMiddleware', () => {
    it('returns 401 when unauthenticated', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue('Bearer invalid') },
      } as unknown as NextRequest;

      mockVerifyJWT.mockRejectedValue(new Error('invalid token'));

      const middleware = createRoleMiddleware();
      const handler = jest.fn();

      const response = await middleware(mockRequest, handler);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns 403 for disallowed role', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue('Bearer valid.token') },
      } as unknown as NextRequest;

      mockVerifyJWT.mockResolvedValue({
        userId: 'user-4',
        email: 'tech@test.com',
        role: 'technician',
      });

      getMockPrisma().user.findUnique.mockResolvedValue({
        id: 'user-4',
        email: 'tech@test.com',
        name: 'Tech',
        role: 'technician',
      });

      const middleware = createRoleMiddleware({ allowedRoles: ['admin'] });
      const handler = jest.fn();

      const response = await middleware(mockRequest, handler);

      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns 403 when permission is missing', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue('Bearer valid.token') },
        method: 'DELETE',
        nextUrl: { pathname: '/api/clientes/123' },
      } as unknown as NextRequest;

      mockVerifyJWT.mockResolvedValue({
        userId: 'user-5',
        email: 'user@test.com',
        role: 'user',
      });

      getMockPrisma().user.findUnique.mockResolvedValue({
        id: 'user-5',
        email: 'user@test.com',
        name: 'User',
        role: 'user',
      });

      const middleware = createRoleMiddleware();
      const handler = jest.fn();

      const response = await middleware(mockRequest, handler);

      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('calls handler when authorized', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue('Bearer valid.token') },
        method: 'GET',
        nextUrl: { pathname: '/api/clientes' },
      } as unknown as NextRequest;

      mockVerifyJWT.mockResolvedValue({
        userId: 'user-6',
        email: 'admin@test.com',
        role: 'admin',
      });

      getMockPrisma().user.findUnique.mockResolvedValue({
        id: 'user-6',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
      });

      const mockResponse = new NextResponse('OK', { status: 200 });
      const middleware = createRoleMiddleware();
      const handler = jest.fn().mockResolvedValue(mockResponse);

      const response = await middleware(mockRequest, handler);

      expect(handler).toHaveBeenCalledWith(mockRequest, expect.any(Object));
      expect(response).toBe(mockResponse);
    });

    it('returns 500 when custom check throws', async () => {
      const mockError = new Error('Unexpected error');
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue('Bearer valid.token') },
        method: 'GET',
        nextUrl: { pathname: '/api/test' },
      } as unknown as NextRequest;

      mockVerifyJWT.mockResolvedValue({
        userId: 'user-7',
        email: 'admin@test.com',
        role: 'admin',
      });

      getMockPrisma().user.findUnique.mockResolvedValue({
        id: 'user-7',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
      });

      const customCheck = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const middleware = createRoleMiddleware({ customCheck });
      const handler = jest.fn();

      const response = await middleware(mockRequest, handler);

      expect(response.status).toBe(500);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erro no middleware de autorização:',
        mockError
      );

      consoleSpy.mockRestore();
    });
  });

  describe('canUserAccessRoute', () => {
    it('allows unknown/public routes', () => {
      const user: AuthenticatedUser = {
        id: 'user-8',
        email: 'user@test.com',
        name: 'User',
        role: 'user',
      };

      const result = canUserAccessRoute(user, '/api/unknown', 'GET');
      expect(result).toBe(true);
    });

    it('allows access for admin on protected routes', () => {
      const user: AuthenticatedUser = {
        id: 'user-9',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
      };

      const result = canUserAccessRoute(user, '/api/clientes', 'GET');
      expect(result).toBe(true);
    });

    it('denies access without required permission', () => {
      const user: AuthenticatedUser = {
        id: 'user-10',
        email: 'user@test.com',
        name: 'User',
        role: 'user',
      };

      const result = canUserAccessRoute(user, '/api/admin/users', 'GET');
      expect(result).toBe(false);
    });
  });

  describe('getPermissionDebugInfo', () => {
    it('returns normalized route and access debug info', () => {
      const user: AuthenticatedUser = {
        id: 'user-11',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
      };

      const info = getPermissionDebugInfo(user, '/api/clientes/123', 'GET');

      expect(info.user.id).toBe('user-11');
      expect(info.route.normalized).toBe('/api/clientes/[id]');
      expect(info.permissions.hasAccess).toBe(true);
    });
  });
});
