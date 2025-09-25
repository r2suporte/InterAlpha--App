// Mock global para Request e Response do Next.js - DEVE vir antes de qualquer importação
global.Request = class MockRequest {
  constructor(input: any, init?: any) {
    Object.assign(this, { input, ...init });
  }
} as any;

global.Response = class MockResponse {
  constructor(body?: any, init?: any) {
    Object.assign(this, { body, ...init });
  }
} as any;

// Mock para next/server
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(input: any, init?: any) {
      Object.assign(this, { input, ...init });
    }
  },
  NextResponse: class MockNextResponse {
    static json(data: any) {
      return { json: data };
    }
    static redirect(url: string) {
      return { redirect: url };
    }
  }
}));

// Mock para next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }))
}));

// Mock para @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}));

/**
 * Testes para role-middleware.ts
 * Valida o sistema de permissões e autorização de rotas
 */

import { ROUTE_PERMISSIONS } from '@/lib/auth/role-middleware';

describe('Role Middleware', () => {
  describe('ROUTE_PERMISSIONS', () => {
    it('deve ter permissões definidas para rotas de clientes', () => {
      expect(ROUTE_PERMISSIONS['/api/clientes']).toBeDefined();
      const permissions = ROUTE_PERMISSIONS['/api/clientes'].map(p => p.permission);
      expect(permissions).toContain('clientes.read');
    });

    it('deve ter permissões definidas para rotas de ordens de serviço', () => {
      expect(ROUTE_PERMISSIONS['/api/ordens-servico']).toBeDefined();
      const permissions = ROUTE_PERMISSIONS['/api/ordens-servico'].map(p => p.permission);
      expect(permissions).toContain('ordens_servico.read');
    });

    it('deve ter permissões definidas para rotas de pagamentos', () => {
      expect(ROUTE_PERMISSIONS['/api/pagamentos']).toBeDefined();
      const permissions = ROUTE_PERMISSIONS['/api/pagamentos'].map(p => p.permission);
      expect(permissions).toContain('pagamentos.read');
    });

    it('deve ter permissões definidas para rotas de peças', () => {
      expect(ROUTE_PERMISSIONS['/api/pecas']).toBeDefined();
      const permissions = ROUTE_PERMISSIONS['/api/pecas'].map(p => p.permission);
      expect(permissions).toContain('pecas.read');
    });

    it('deve ter permissões definidas para rotas de relatórios básicos', () => {
      expect(ROUTE_PERMISSIONS['/api/relatorios/basic']).toBeDefined();
      const permissions = ROUTE_PERMISSIONS['/api/relatorios/basic'].map(p => p.permission);
      expect(permissions).toContain('relatorios.view_basic');
    });

    it('deve ter permissões definidas para rotas de administração', () => {
      expect(ROUTE_PERMISSIONS['/api/admin/users']).toBeDefined();
      const permissions = ROUTE_PERMISSIONS['/api/admin/users'].map(p => p.permission);
      expect(permissions).toContain('admin.users.read');
    });

    it('deve ter estrutura correta para cada rota', () => {
      const routeKeys = Object.keys(ROUTE_PERMISSIONS);
      expect(routeKeys.length).toBeGreaterThan(0);

      routeKeys.forEach(route => {
        const routePermissions = ROUTE_PERMISSIONS[route];
        expect(Array.isArray(routePermissions)).toBe(true);
        expect(routePermissions.length).toBeGreaterThan(0);
        
        routePermissions.forEach(permission => {
          expect(permission).toHaveProperty('permission');
          expect(typeof permission.permission).toBe('string');
          if (permission.methods) {
            expect(Array.isArray(permission.methods)).toBe(true);
          }
        });
      });
    });

    it('deve ter permissões específicas para métodos HTTP diferentes', () => {
      // Verifica se existem permissões diferentes para GET, POST, PUT, DELETE
      const allPermissions = Object.values(ROUTE_PERMISSIONS).flat();
      
      const readPermissions = allPermissions.filter(p => p.permission.includes('.read'));
      const createPermissions = allPermissions.filter(p => p.permission.includes('.create'));
      const updatePermissions = allPermissions.filter(p => p.permission.includes('.update'));
      const deletePermissions = allPermissions.filter(p => p.permission.includes('.delete'));

      expect(readPermissions.length).toBeGreaterThan(0);
      expect(createPermissions.length).toBeGreaterThan(0);
      expect(updatePermissions.length).toBeGreaterThan(0);
      expect(deletePermissions.length).toBeGreaterThan(0);
    });
  });

  describe('Estrutura de Permissões', () => {
    it('deve ter permissões consistentes para cada módulo', () => {
      const modules = ['clientes', 'ordens_servico', 'pagamentos', 'pecas'];
      const actions = ['read', 'create', 'update', 'delete'];

      modules.forEach(module => {
        actions.forEach(action => {
          const permission = `${module}.${action}`;
          const hasPermission = Object.values(ROUTE_PERMISSIONS).flat().some(p =>
            p.permission === permission
          );
          expect(hasPermission).toBe(true);
        });
      });
    });

    it('deve ter permissões de admin para rotas administrativas', () => {
      const adminRoutes = Object.keys(ROUTE_PERMISSIONS).filter(route => 
        route.includes('/admin')
      );

      adminRoutes.forEach(route => {
        const routePermissions = ROUTE_PERMISSIONS[route];
        const hasAdminPermission = routePermissions.some(p => p.permission.includes('admin.'));
        expect(hasAdminPermission).toBe(true);
      });
    });
  });

  describe('Validação de Estrutura', () => {
    it('deve ter todas as rotas com formato válido', () => {
      const routeKeys = Object.keys(ROUTE_PERMISSIONS);
      
      routeKeys.forEach(route => {
        expect(route).toMatch(/^\/api\//);
        expect(typeof route).toBe('string');
        expect(route.length).toBeGreaterThan(4);
      });
    });

    it('deve ter permissões com formato válido', () => {
      Object.values(ROUTE_PERMISSIONS).forEach(routePermissions => {
        routePermissions.forEach(routePermission => {
          expect(routePermission.permission).toMatch(/^[a-z_]+\.[a-z_]+/);
          expect(typeof routePermission.permission).toBe('string');
        });
      });
    });
  });
});