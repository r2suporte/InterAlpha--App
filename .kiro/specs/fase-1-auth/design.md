# Design - Fase 1: Autenticação e Estrutura Base

## Overview

Esta fase implementa o sistema de autenticação completo usando Clerk e estabelece a estrutura base da aplicação InterAlpha com navegação e layout responsivo.

## Architecture

### Estrutura de Rotas
```
/                          # Landing page (público)
/servicos                  # Página de serviços (público)
/sign-in/[[...sign-in]]   # Login do Clerk
/sign-up/[[...sign-up]]   # Cadastro do Clerk
/dashboard                 # Dashboard principal (protegido)
/clientes                  # Gestão de clientes (protegido)
/ordens-servico           # Gestão de O.S. (protegido)
/pagamentos               # Gestão de pagamentos (protegido)
```

### Middleware de Autenticação
- Usar Clerk middleware para proteger rotas
- Rotas públicas: `/`, `/servicos`, `/api/webhooks/*`
- Rotas protegidas: `/dashboard`, `/clientes`, `/ordens-servico`, `/pagamentos`

## Components and Interfaces

### Layout Principal (`/src/app/layout.tsx`)
- ClerkProvider envolvendo toda aplicação
- Configuração de metadados em português
- Font Inter para consistência visual

### Dashboard Layout (`/src/app/(dashboard)/layout.tsx`)
```tsx
interface DashboardLayoutProps {
  children: React.ReactNode
}

// Componentes:
// - Header com logo, navegação e user menu
// - Sidebar com menu principal
// - Main content area
// - Responsive design
```

### Componentes de Navegação

#### Header Component
```tsx
interface HeaderProps {
  user: User | null
}

// Funcionalidades:
// - Logo InterAlpha
// - Menu de usuário (avatar, nome, logout)
// - Menu hambúrguer para mobile
// - Breadcrumbs
```

#### Sidebar Component
```tsx
interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

// Menu items:
// - Dashboard (home icon)
// - Clientes (users icon)
// - Ordens de Serviço (wrench icon)
// - Pagamentos (credit-card icon)
// - Configurações (settings icon)
```

### Páginas de Autenticação

#### Sign In Page (`/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`)
```tsx
// Usar componente SignIn do Clerk
// Layout centralizado com logo
// Redirecionamento após login: /dashboard
```

#### Sign Up Page (`/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`)
```tsx
// Usar componente SignUp do Clerk  
// Layout centralizado com logo
// Redirecionamento após cadastro: /dashboard
```

## Data Models

### User (Clerk)
```typescript
interface ClerkUser {
  id: string
  emailAddresses: EmailAddress[]
  firstName: string | null
  lastName: string | null
  imageUrl: string
  createdAt: number
  updatedAt: number
}
```

### Navigation Item
```typescript
interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  current?: boolean
  badge?: number
}
```

## Error Handling

### Autenticação
- Redirecionamento automático para login em rotas protegidas
- Mensagens de erro do Clerk traduzidas para português
- Fallback para páginas de erro personalizadas

### Navegação
- 404 personalizada para páginas não encontradas
- Loading states durante navegação
- Error boundaries para componentes

## Testing Strategy

### Testes de Autenticação
- Fluxo de login completo
- Fluxo de cadastro completo
- Proteção de rotas
- Logout e redirecionamento

### Testes de Navegação
- Menu responsivo
- Navegação entre páginas
- Estados ativos do menu
- Breadcrumbs

### Testes de Layout
- Responsividade em diferentes tamanhos
- Menu hambúrguer em mobile
- Sidebar collapse/expand
- Header fixo durante scroll

## Responsive Design

### Breakpoints
- Mobile: < 768px (menu hambúrguer, sidebar oculta)
- Tablet: 768px - 1024px (sidebar colapsável)
- Desktop: > 1024px (sidebar fixa)

### Mobile First
- Layout stack vertical em mobile
- Touch-friendly buttons e links
- Sidebar como overlay em mobile
- Menu hambúrguer com animação

## Styling Guidelines

### Cores (seguindo design system)
- Primary: Blue 600 (#2563eb)
- Secondary: Gray 100 (#f3f4f6)
- Success: Green 600 (#16a34a)
- Warning: Yellow 600 (#ca8a04)
- Error: Red 600 (#dc2626)

### Typography
- Font: Inter
- Headings: font-semibold
- Body: font-normal
- Small text: text-sm

### Spacing
- Container: max-w-7xl mx-auto px-4
- Sections: py-8 ou py-12
- Cards: p-6
- Buttons: px-4 py-2