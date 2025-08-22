# Autenticação e Autorização

## Visão Geral

O sistema de autenticação e autorização do InterAlpha é baseado no Clerk, com um sistema de controle de acesso personalizado que implementa Role-Based Access Control (RBAC).

## Autenticação com Clerk

### Configuração
- O Clerk é configurado como provider em `src/app/layout.tsx`
- Chaves de API são armazenadas em variáveis de ambiente
- A autenticação é verificada no middleware

### Componentes Principais
- `ClerkProvider` - Wrapper principal para a aplicação
- `useUser` - Hook para acessar informações do usuário autenticado
- `SignIn`/`SignUp` - Componentes de autenticação do Clerk
- Páginas de login em `/sign-in` e `/sign-up`

## Sistema de Roles e Permissões

### Roles Definidos
1. `admin` - Administrador do sistema
2. `gerente-adm` - Gerente Administrativo
3. `gerente-financeiro` - Gerente Financeiro
4. `supervisor-tecnico` - Supervisor Técnico
5. `tecnico` - Técnico
6. `atendente` - Atendente

### Permissões
Cada role tem um conjunto específico de permissões definidas em `src/lib/auth/permissions.ts`:

```typescript
export enum Permission {
  // Funcionários
  MANAGE_EMPLOYEES = 'manage_employees',
  VIEW_EMPLOYEES = 'view_employees',
  
  // Clientes
  MANAGE_CLIENTS = 'manage_clients',
  VIEW_CLIENTS = 'view_clients',
  
  // Ordens de Serviço
  MANAGE_ORDERS = 'manage_orders',
  VIEW_ORDERS = 'view_orders',
  ASSIGN_ORDERS = 'assign_orders',
  
  // Produtos
  MANAGE_PRODUCTS = 'manage_products',
  VIEW_PRODUCTS = 'view_products',
  
  // Financeiro
  MANAGE_PAYMENTS = 'manage_payments',
  VIEW_PAYMENTS = 'view_payments',
  APPROVE_PAYMENTS = 'approve_payments',
  
  // Relatórios
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',
  
  // Sistema
  MANAGE_SYSTEM = 'manage_system',
  VIEW_AUDIT = 'view_audit'
}
```

## Middleware de Autenticação

O middleware em `middleware.ts` é responsável por:

1. Verificar se as rotas requerem autenticação
2. Redirecionar usuários não autenticados para a página de login
3. Verificar permissões para usuários autenticados
4. Redirecionar usuários sem permissão para página de acesso negado

### Rotas Protegidas
- `/dashboard(.*)`
- `/clientes(.*)`
- `/ordens-servico(.*)`
- `/produtos(.*)`
- `/pagamentos(.*)`
- `/relatorios(.*)`
- `/admin(.*)`
- `/auditoria(.*)`

### Rotas Públicas
- `/`
- `/sign-in(.*)`
- `/sign-up(.*)`
- `/client/login`
- `/api/auth/client(.*)`
- `/api/validate(.*)`

## Controle de Acesso no Frontend

### Verificação de Permissões
Utilizar o hook `useUser` para acessar o role do usuário e verificar permissões:

```typescript
import { useUser } from '@/contexts/UserContext';
import { hasPermission, Permission } from '@/lib/auth/permissions';

const { user } = useUser();
const userRole = user?.role;

// Verificar se o usuário tem uma permissão específica
if (hasPermission(userRole, Permission.MANAGE_CLIENTS)) {
  // Renderizar componente que requer essa permissão
}
```

### Renderização Condicional
Componentes e elementos da UI devem ser renderizados condicionalmente com base nas permissões do usuário:

```tsx
{hasPermission(userRole, Permission.MANAGE_CLIENTS) && (
  <Button onClick={handleAddClient}>Adicionar Cliente</Button>
)}
```

## Controle de Acesso no Backend

### Proteção de API Routes
As API routes verificam a autenticação e permissões:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { userId } = auth();
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Verificar permissões adicionais se necessário
  // ...
}
```

### Validação de Dados
Todas as operações que modificam dados devem verificar:
1. Se o usuário está autenticado
2. Se o usuário tem permissão para realizar a operação
3. Se o usuário tem acesso ao recurso específico (por exemplo, não permitir que um técnico edite dados de outro técnico)

## Gerenciamento de Sessão

### Expiração
- Sessões são gerenciadas pelo Clerk
- Configurações de expiração podem ser ajustadas no dashboard do Clerk

### Logout
- Implementado através do componente `SignOutButton` do Clerk
- Limpa estado local da aplicação ao fazer logout

## Boas Práticas

### 1. Segurança
- Nunca confiar apenas no controle de acesso do frontend
- Sempre validar permissões no backend
- Utilizar tokens JWT assinados para autenticação
- Implementar rate limiting para endpoints de autenticação

### 2. Experiência do Usuário
- Mostrar mensagens claras quando o acesso for negado
- Redirecionar usuários não autenticados para a página apropriada
- Manter estado da aplicação durante o processo de autenticação

### 3. Manutenção
- Manter a lista de roles e permissões atualizada
- Documentar todas as permissões e seus significados
- Testar cenários de acesso em diferentes roles
- Utilizar feature flags para novas funcionalidades restritas

### 4. Auditoria
- Registrar tentativas de acesso não autorizado
- Manter logs de mudanças em permissões de usuários
- Implementar notificações para atividades suspeitas