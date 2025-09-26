/**
 * Middleware de Autorização Avançado
 * Gerencia autenticação e autorização baseada em roles para rotas da API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PermissionManager, UserRole } from './permissions';

// Tipos para configuração de rotas
export interface RoutePermission {
  permission: string;
  methods?: string[];
  description?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

// Mapeamento de rotas para permissões requeridas
export const ROUTE_PERMISSIONS: Record<string, RoutePermission[]> = {
  // Rotas de clientes
  '/api/clientes': [
    { permission: 'clientes.read', methods: ['GET'] },
    { permission: 'clientes.create', methods: ['POST'] }
  ],
  '/api/clientes/[id]': [
    { permission: 'clientes.read', methods: ['GET'] },
    { permission: 'clientes.update', methods: ['PUT', 'PATCH'] },
    { permission: 'clientes.delete', methods: ['DELETE'] }
  ],
  
  // Rotas de ordens de serviço
  '/api/ordens-servico': [
    { permission: 'ordens_servico.read', methods: ['GET'] },
    { permission: 'ordens_servico.create', methods: ['POST'] }
  ],
  '/api/ordens-servico/[id]': [
    { permission: 'ordens_servico.read', methods: ['GET'] },
    { permission: 'ordens_servico.update', methods: ['PUT', 'PATCH'] },
    { permission: 'ordens_servico.delete', methods: ['DELETE'] }
  ],
  '/api/ordens-servico/[id]/assign-technician': [
    { permission: 'ordens_servico.assign_technician', methods: ['POST', 'PUT'] }
  ],
  '/api/ordens-servico/[id]/status': [
    { permission: 'ordens_servico.change_status', methods: ['PUT', 'PATCH'] }
  ],
  
  // Rotas de pagamentos
  '/api/pagamentos': [
    { permission: 'pagamentos.read', methods: ['GET'] },
    { permission: 'pagamentos.create', methods: ['POST'] }
  ],
  '/api/pagamentos/[id]': [
    { permission: 'pagamentos.read', methods: ['GET'] },
    { permission: 'pagamentos.update', methods: ['PUT', 'PATCH'] },
    { permission: 'pagamentos.delete', methods: ['DELETE'] }
  ],
  '/api/pagamentos/[id]/approve': [
    { permission: 'pagamentos.approve', methods: ['POST', 'PUT'] }
  ],
  
  // Rotas de peças
  '/api/pecas': [
    { permission: 'pecas.read', methods: ['GET'] },
    { permission: 'pecas.create', methods: ['POST'] }
  ],
  '/api/pecas/[id]': [
    { permission: 'pecas.read', methods: ['GET'] },
    { permission: 'pecas.update', methods: ['PUT', 'PATCH'] },
    { permission: 'pecas.delete', methods: ['DELETE'] }
  ],
  
  // Rotas de relatórios
  '/api/relatorios/basic': [
    { permission: 'relatorios.view_basic', methods: ['GET'] }
  ],
  '/api/relatorios/financial': [
    { permission: 'relatorios.view_financial', methods: ['GET'] }
  ],
  '/api/relatorios/technical': [
    { permission: 'relatorios.view_technical', methods: ['GET'] }
  ],
  '/api/relatorios/export': [
    { permission: 'relatorios.export', methods: ['GET', 'POST'] }
  ],
  
  // Rotas administrativas
  '/api/admin/users': [
    { permission: 'admin.users.read', methods: ['GET'] },
    { permission: 'admin.users.create', methods: ['POST'] }
  ],
  '/api/admin/users/[id]': [
    { permission: 'admin.users.read', methods: ['GET'] },
    { permission: 'admin.users.update', methods: ['PUT', 'PATCH'] },
    { permission: 'admin.users.delete', methods: ['DELETE'] }
  ],
  '/api/admin/roles': [
    { permission: 'admin.roles.manage', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
  ]
};

/**
 * Verifica a autenticação do usuário e obtém suas informações
 */
export async function checkRolePermission(request: NextRequest): Promise<{
  authenticated: boolean;
  user?: AuthenticatedUser;
  error?: string;
}> {
  try {
    // Verifica se há um token Bearer no header Authorization
    const authHeader = request.headers.get('authorization');
    let session = null;
    let sessionError = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Autenticação via Bearer token
      const token = authHeader.substring(7);
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return [];
            },
            setAll() {
              // Não fazer nada para Bearer tokens
            },
          },
        }
      );

      // Define a sessão manualmente com o token
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        return {
          authenticated: false,
          error: 'Token inválido'
        };
      }

      session = {
        user: data.user,
        access_token: token
      };
    } else {
      // Autenticação via cookies (para navegador)
      const cookieStore = await cookies();
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      );
      
      // Verifica se o usuário está autenticado via cookies
      const { data: { session: cookieSession }, error } = await supabase.auth.getSession();
      session = cookieSession;
      sessionError = error;
    }
    
    if (sessionError || !session?.user) {
      return {
        authenticated: false,
        error: 'Usuário não autenticado'
      };
    }
    
    // Cria uma instância do Supabase para buscar dados do usuário
    const supabaseForUserData = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // Não fazer nada
          },
        },
      }
    );
    
    // Busca informações do usuário no banco de dados
    const { data: userData, error: userError } = await supabaseForUserData
      .from('users')
      .select('id, email, role')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !userData) {
      return {
        authenticated: false,
        error: 'Dados do usuário não encontrados'
      };
    }
    
    // Valida se a role é válida
    if (!PermissionManager.isValidRole(userData.role)) {
      return {
        authenticated: false,
        error: 'Role do usuário inválida'
      };
    }
    
    return {
      authenticated: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role as UserRole
      }
    };
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    return {
      authenticated: false,
      error: 'Erro interno na autenticação'
    };
  }
}

/**
 * Normaliza o caminho da rota para comparação
 */
function normalizeRoutePath(pathname: string): string {
  // Remove query parameters
  const pathWithoutQuery = pathname.split('?')[0];
  
  // Converte IDs dinâmicos para padrão [id]
  return pathWithoutQuery.replace(/\/\d+/g, '/[id]');
}

/**
 * Encontra as permissões necessárias para uma rota específica
 */
function getRequiredPermissions(pathname: string, method: string): string[] {
  const normalizedPath = normalizeRoutePath(pathname);
  const routePermissions = ROUTE_PERMISSIONS[normalizedPath];
  
  if (!routePermissions) {
    return [];
  }
  
  return routePermissions
    .filter(rp => !rp.methods || rp.methods.includes(method))
    .map(rp => rp.permission);
}

/**
 * Cria um middleware de autorização para uma rota específica
 */
export function createRoleMiddleware(options?: {
  allowedRoles?: UserRole[];
  requiredPermissions?: string[];
  customCheck?: (user: AuthenticatedUser, request: NextRequest) => boolean;
}) {
  return async function roleMiddleware(
    request: NextRequest,
    handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Verifica autenticação
      const authResult = await checkRolePermission(request);
      
      if (!authResult.authenticated || !authResult.user) {
        return NextResponse.json(
          { 
            error: 'Não autorizado',
            message: authResult.error || 'Usuário não autenticado'
          },
          { status: 401 }
        );
      }
      
      const user = authResult.user;
      
      // Verifica roles permitidas (se especificadas)
      if (options?.allowedRoles && !options.allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { 
            error: 'Acesso negado',
            message: 'Role do usuário não tem permissão para acessar este recurso'
          },
          { status: 403 }
        );
      }
      
      // Verifica permissões específicas
      const requiredPermissions = options?.requiredPermissions || 
        getRequiredPermissions(request.nextUrl.pathname, request.method);
      
      for (const permission of requiredPermissions) {
        if (!PermissionManager.hasPermission(user.role, permission)) {
          return NextResponse.json(
            { 
              error: 'Permissão insuficiente',
              message: `Usuário não possui a permissão: ${permission}`
            },
            { status: 403 }
          );
        }
      }
      
      // Verifica função customizada (se especificada)
      if (options?.customCheck && !options.customCheck(user, request)) {
        return NextResponse.json(
          { 
            error: 'Acesso negado',
            message: 'Verificação customizada de permissão falhou'
          },
          { status: 403 }
        );
      }
      
      // Se todas as verificações passaram, executa o handler
      return await handler(request, user);
      
    } catch (error) {
      console.error('Erro no middleware de autorização:', error);
      return NextResponse.json(
        { 
          error: 'Erro interno',
          message: 'Erro interno do servidor'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware simplificado para verificar apenas autenticação
 */
export function requireAuth() {
  return createRoleMiddleware();
}

/**
 * Middleware para verificar roles específicas
 */
export function requireRoles(...roles: UserRole[]) {
  return createRoleMiddleware({ allowedRoles: roles });
}

/**
 * Middleware para verificar permissões específicas
 */
export function requirePermissions(...permissions: string[]) {
  return createRoleMiddleware({ requiredPermissions: permissions });
}

/**
 * Middleware para administradores
 */
export function requireAdmin() {
  return createRoleMiddleware({ 
    allowedRoles: ['admin'] 
  });
}

/**
 * Middleware para diretores e acima
 */
export function requireDiretor() {
  return createRoleMiddleware({ 
    allowedRoles: ['admin', 'diretor'] 
  });
}

/**
 * Middleware para gerentes administrativos e acima
 */
export function requireGerenteAdm() {
  return createRoleMiddleware({ 
    allowedRoles: ['admin', 'diretor', 'gerente_adm'] 
  });
}

/**
 * Middleware para gerentes financeiros e acima
 */
export function requireGerenteFinanceiro() {
  return createRoleMiddleware({ 
    allowedRoles: ['admin', 'diretor', 'gerente_financeiro'] 
  });
}

/**
 * Middleware para supervisores técnicos e acima
 */
export function requireSupervisorTecnico() {
  return createRoleMiddleware({ 
    allowedRoles: ['admin', 'diretor', 'gerente_adm', 'supervisor_tecnico'] 
  });
}

/**
 * Middleware para técnicos e acima
 */
export function requireTechnician() {
  return createRoleMiddleware({ 
    allowedRoles: ['admin', 'diretor', 'gerente_adm', 'supervisor_tecnico', 'technician'] 
  });
}

/**
 * Middleware para atendentes e acima (qualquer usuário autenticado)
 */
export function requireAtendente() {
  return createRoleMiddleware({ 
    allowedRoles: ['admin', 'diretor', 'gerente_adm', 'gerente_financeiro', 'supervisor_tecnico', 'technician', 'atendente'] 
  });
}

/**
 * Middleware baseado em hierarquia - verifica se o usuário tem nível suficiente
 */
export function requireMinimumRole(minimumRole: UserRole) {
  return createRoleMiddleware({
    customCheck: (user) => {
      return PermissionManager.canManageRole(user.role, minimumRole);
    }
  });
}

/**
 * Middleware para verificar acesso a recursos específicos
 */
export function requireResourceAccess(resource: string) {
  return createRoleMiddleware({
    customCheck: (user) => {
      return PermissionManager.canAccessResource(user.role, resource);
    }
  });
}

/**
 * Utilitário para verificar se um usuário pode acessar um recurso
 */
export function canUserAccessRoute(
  user: AuthenticatedUser, 
  pathname: string, 
  method: string
): boolean {
  const requiredPermissions = getRequiredPermissions(pathname, method);
  
  if (requiredPermissions.length === 0) {
    return true; // Rota pública
  }
  
  return requiredPermissions.every(permission => 
    PermissionManager.hasPermission(user.role, permission)
  );
}

/**
 * Utilitário para obter informações de debug sobre permissões
 */
export function getPermissionDebugInfo(
  user: AuthenticatedUser,
  pathname: string,
  method: string
) {
  const normalizedPath = normalizeRoutePath(pathname);
  const requiredPermissions = getRequiredPermissions(pathname, method);
  const userPermissions = PermissionManager.getAllPermissions(user.role);
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      roleLevel: PermissionManager.getRoleLevel(user.role)
    },
    route: {
      original: pathname,
      normalized: normalizedPath,
      method
    },
    permissions: {
      required: requiredPermissions,
      userHas: userPermissions,
      hasAccess: canUserAccessRoute(user, pathname, method)
    }
  };
}