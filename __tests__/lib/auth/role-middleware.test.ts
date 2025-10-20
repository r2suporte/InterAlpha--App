/**
 * @jest-environment node
 */

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('../../../lib/auth/permissions', () => ({
  PermissionManager: {
    isValidRole: jest.fn().mockReturnValue(true),
    hasPermission: jest.fn().mockReturnValue(true),
    getAllPermissions: jest.fn().mockReturnValue([]),
    getRoleLevel: jest.fn().mockReturnValue(0),
    canManageRole: jest.fn().mockReturnValue(true),
    canAccessResource: jest.fn().mockReturnValue(true),
  },
}));

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { PermissionManager } from '../../../lib/auth/permissions';
import {
  checkRolePermission,
  createRoleMiddleware,
  canUserAccessRoute,
  getPermissionDebugInfo,
  ROUTE_PERMISSIONS,
  type AuthenticatedUser,
} from '../../../lib/auth/role-middleware';

const mockCreateServerClient = createServerClient as jest.Mock;
const mockCookies = cookies as jest.Mock;
const mockPermissionManager = PermissionManager as any;

describe('lib/auth/role-middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ROUTE_PERMISSIONS', () => {
    it('should have resource route permissions', () => {
      expect(ROUTE_PERMISSIONS['/api/clientes']).toBeDefined();
      expect(ROUTE_PERMISSIONS['/api/ordens-servico']).toBeDefined();
    });

    it('should map HTTP methods to permissions', () => {
      const clientesPerms = ROUTE_PERMISSIONS['/api/clientes'];
      const getPerms = clientesPerms.filter(p => p.methods?.includes('GET'));
      expect(getPerms.length).toBeGreaterThan(0);
    });
  });

  describe('checkRolePermission', () => {
    it('returns unauthenticated without auth header', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
      } as unknown as NextRequest;

      mockCookies.mockResolvedValue({
        getAll: jest.fn().mockReturnValue([]),
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: new Error('No session'),
          }),
        },
      });

      const result = await checkRolePermission(mockRequest);
      expect(result.authenticated).toBe(false);
    });

    it('authenticates with valid Bearer token', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue('Bearer valid.token') },
      } as unknown as NextRequest;

      mockCreateServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1', email: 'admin@test.com' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-1', email: 'admin@test.com', role: 'admin' },
          error: null,
        }),
      });

      mockPermissionManager.isValidRole.mockReturnValue(true);

      const result = await checkRolePermission(mockRequest);
      expect(result.authenticated).toBe(true);
    });

    it('returns error for invalid token', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue('Bearer invalid') },
      } as unknown as NextRequest;

      mockCreateServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Invalid'),
          }),
        },
      });

      const result = await checkRolePermission(mockRequest);
      expect(result.error).toBe('Token inválido');
    });

    it('authenticates from cookie session', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
      } as unknown as NextRequest;

      mockCookies.mockResolvedValue({
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { user: { id: 'user-2', email: 'tech@test.com' } },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-2', email: 'tech@test.com', role: 'technician' },
          error: null,
        }),
      });

      mockPermissionManager.isValidRole.mockReturnValue(true);

      const result = await checkRolePermission(mockRequest);
      expect(result.authenticated).toBe(true);
    });

    it('returns error when user not found', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
      } as unknown as NextRequest;

      mockCookies.mockResolvedValue({
        getAll: jest.fn().mockReturnValue([]),
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { user: { id: 'user-ghost', email: 'ghost@test.com' } },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        }),
      });

      const result = await checkRolePermission(mockRequest);
      expect(result.error).toBe('Dados do usuário não encontrados');
    });

    it('returns error for invalid role', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
      } as unknown as NextRequest;

      mockCookies.mockResolvedValue({
        getAll: jest.fn().mockReturnValue([]),
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { user: { id: 'user-bad', email: 'bad@test.com' } },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-bad', email: 'bad@test.com', role: 'invalid' },
          error: null,
        }),
      });

      mockPermissionManager.isValidRole.mockReturnValue(false);

      const result = await checkRolePermission(mockRequest);
      expect(result.error).toBe('Role do usuário inválida');
    });

    it('handles exceptions gracefully', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockImplementation(() => {
            throw new Error('Connection failed');
          }),
        },
      } as unknown as NextRequest;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await checkRolePermission(mockRequest);

      expect(result.error).toBe('Erro interno na autenticação');

      consoleSpy.mockRestore();
    });
  });

  describe('createRoleMiddleware', () => {
    it('returns 401 when unauthenticated', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
      } as unknown as NextRequest;

      mockCookies.mockResolvedValue({
        getAll: jest.fn().mockReturnValue([]),
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: new Error('No session'),
          }),
        },
      });

      const middleware = createRoleMiddleware();
      const handler = jest.fn();

      const response = await middleware(mockRequest, handler);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns 403 for disallowed role', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
      } as unknown as NextRequest;

      mockCookies.mockResolvedValue({
        getAll: jest.fn().mockReturnValue([]),
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { user: { id: 'user-3', email: 'tech@test.com' } },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-3', email: 'tech@test.com', role: 'technician' },
          error: null,
        }),
      });

      mockPermissionManager.isValidRole.mockReturnValue(true);

      const middleware = createRoleMiddleware({ allowedRoles: ['admin'] });
      const handler = jest.fn();

      const response = await middleware(mockRequest, handler);

      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns 403 when permission missing', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
        method: 'DELETE',
        nextUrl: { pathname: '/api/clientes/123' },
      } as unknown as NextRequest;

      mockCookies.mockResolvedValue({
        getAll: jest.fn().mockReturnValue([]),
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { user: { id: 'user-4', email: 'user@test.com' } },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-4', email: 'user@test.com', role: 'user' },
          error: null,
        }),
      });

      mockPermissionManager.isValidRole.mockReturnValue(true);
      mockPermissionManager.hasPermission.mockReturnValue(false);

      const middleware = createRoleMiddleware();
      const handler = jest.fn();

      const response = await middleware(mockRequest, handler);

      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('calls handler when authorized', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
        nextUrl: { pathname: '/api/test' },
        method: 'GET',
      } as unknown as NextRequest;

      mockCookies.mockResolvedValue({
        getAll: jest.fn().mockReturnValue([]),
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { user: { id: 'user-5', email: 'admin@test.com' } },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-5', email: 'admin@test.com', role: 'admin' },
          error: null,
        }),
      });

      mockPermissionManager.isValidRole.mockReturnValue(true);
      mockPermissionManager.hasPermission.mockReturnValue(true);

      const mockResponse = new NextResponse('OK', { status: 200 });
      const middleware = createRoleMiddleware();
      const handler = jest.fn().mockResolvedValue(mockResponse);

      const response = await middleware(mockRequest, handler);

      expect(handler).toHaveBeenCalledWith(mockRequest, expect.any(Object));
      expect(response).toBe(mockResponse);
    });

    it('supports custom check function', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
        nextUrl: { pathname: '/api/test' },
        method: 'GET',
      } as unknown as NextRequest;

      mockCookies.mockResolvedValue({
        getAll: jest.fn().mockReturnValue([]),
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { user: { id: 'user-6', email: 'user@test.com' } },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-6', email: 'user@test.com', role: 'admin' },
          error: null,
        }),
      });

      mockPermissionManager.isValidRole.mockReturnValue(true);

      const customCheck = jest.fn().mockReturnValue(false);
      const middleware = createRoleMiddleware({ customCheck });
      const handler = jest.fn();

      const response = await middleware(mockRequest, handler);

      expect(customCheck).toHaveBeenCalled();
      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns 500 on internal error', async () => {
      const mockError = new Error('Unexpected error');
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
        nextUrl: { pathname: '/api/test' },
        method: 'GET',
      } as unknown as NextRequest;

      mockCookies.mockResolvedValue({
        getAll: jest.fn().mockReturnValue([]),
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { user: { id: 'user-error', email: 'error@test.com' } },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-error', email: 'error@test.com', role: 'admin' },
          error: null,
        }),
      });

      mockPermissionManager.isValidRole.mockReturnValue(true);
      mockPermissionManager.hasPermission.mockReturnValue(true);

      // Mock customCheck para lançar erro
      const customCheck = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      const middleware = createRoleMiddleware({ customCheck });
      const handler = jest.fn();

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

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
    it('allows public routes', () => {
      const user: AuthenticatedUser = {
        id: 'user-7',
        email: 'user@test.com',
        role: 'user',
      };

      mockPermissionManager.hasPermission.mockReturnValue(true);

      const result = canUserAccessRoute(user, '/api/unknown', 'GET');
      expect(result).toBe(true);
    });

    it('checks permissions for protected routes', () => {
      const user: AuthenticatedUser = {
        id: 'user-8',
        email: 'admin@test.com',
        role: 'admin',
      };

      mockPermissionManager.hasPermission.mockReturnValue(true);

      const result = canUserAccessRoute(user, '/api/clientes', 'GET');
      expect(result).toBe(true);
    });

    it('denies access without permission', () => {
      const user: AuthenticatedUser = {
        id: 'user-9',
        email: 'user@test.com',
        role: 'user',
      };

      mockPermissionManager.hasPermission.mockReturnValue(false);

      const result = canUserAccessRoute(user, '/api/admin/users', 'GET');
      expect(result).toBe(false);
    });
  });

  describe('getPermissionDebugInfo', () => {
    it('returns complete debug information', () => {
      const user: AuthenticatedUser = {
        id: 'user-10',
        email: 'admin@test.com',
        role: 'admin',
      };

      mockPermissionManager.getRoleLevel.mockReturnValue(10);
      mockPermissionManager.getAllPermissions.mockReturnValue(['clientes.read']);
      mockPermissionManager.hasPermission.mockReturnValue(true);

      const info = getPermissionDebugInfo(user, '/api/clientes/123', 'GET');

      expect(info.user.id).toBe('user-10');
      expect(info.route.normalized).toBe('/api/clientes/[id]');
      expect(info.permissions.hasAccess).toBe(true);
    });

    it('normalizes numeric IDs', () => {
      const user: AuthenticatedUser = {
        id: 'user-11',
        email: 'admin@test.com',
        role: 'admin',
      };

      mockPermissionManager.getRoleLevel.mockReturnValue(10);
      mockPermissionManager.getAllPermissions.mockReturnValue([]);
      mockPermissionManager.hasPermission.mockReturnValue(true);

      const info = getPermissionDebugInfo(user, '/api/clientes/456/orders/789', 'GET');

      expect(info.route.normalized).toBe('/api/clientes/[id]/orders/[id]');
    });

    it('handles query parameters', () => {
      const user: AuthenticatedUser = {
        id: 'user-12',
        email: 'admin@test.com',
        role: 'admin',
      };

      mockPermissionManager.getRoleLevel.mockReturnValue(10);
      mockPermissionManager.getAllPermissions.mockReturnValue([]);
      mockPermissionManager.hasPermission.mockReturnValue(true);

      const info = getPermissionDebugInfo(
        user,
        '/api/clientes?filter=active',
        'GET'
      );

      expect(info.route.normalized).toBe('/api/clientes');
    });
  });

  describe('Integration', () => {
    it('complete auth and authz flow', async () => {
      const mockRequest = {
        headers: { get: jest.fn().mockReturnValue(null) },
        nextUrl: { pathname: '/api/clientes' },
        method: 'GET',
      } as unknown as NextRequest;

      mockCookies.mockResolvedValue({
        getAll: jest.fn().mockReturnValue([]),
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { user: { id: 'user-13', email: 'admin@test.com' } },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-13',
            email: 'admin@test.com',
            role: 'admin',
          },
          error: null,
        }),
      });

      mockPermissionManager.isValidRole.mockReturnValue(true);
      mockPermissionManager.hasPermission.mockReturnValue(true);

      const mockResponse = new NextResponse(JSON.stringify({ data: [] }), {
        status: 200,
      });
      const middleware = createRoleMiddleware();
      const handler = jest.fn().mockResolvedValue(mockResponse);

      const response = await middleware(mockRequest, handler);

      expect(handler).toHaveBeenCalled();
      expect(response).toBe(mockResponse);
    });
  });
});
