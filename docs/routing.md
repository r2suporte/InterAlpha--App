# Rotas e Navegação

## Estrutura de Rotas

O InterAlpha utiliza o App Router do Next.js 15, que organiza as rotas através da estrutura de pastas em `src/app/`.

### Estrutura Básica
```
src/app/
├── (dashboard)/           # Rotas do dashboard principal
├── (employee)/            # Rotas específicas para funcionários
├── api/                   # API Routes
├── client/                # Área do cliente
├── sign-in/               # Página de login
├── sign-up/               # Página de registro
├── page.tsx               # Página inicial
├── layout.tsx             # Layout raiz
└── ...
```

### Route Groups
Utilizamos route groups para organizar logicamente as rotas sem afetar a URL:

- `(dashboard)` - Rotas do dashboard principal
- `(employee)` - Rotas para diferentes tipos de funcionários
- `(client)` - Rotas da área do cliente

### Rotas Públicas vs Protegidas
- **Públicas**: `/`, `/sign-in`, `/sign-up`, `/client/login`
- **Protegidas**: Todas as rotas dentro de `(dashboard)` e `(employee)`

## Navegação

### Link do Next.js
Utilizar o componente `Link` do Next.js para navegação interna:

```tsx
import Link from 'next/link';

<Link href="/dashboard">
  Ir para o Dashboard
</Link>
```

### useRouter Hook
Para navegação programática, utilizar o hook `useRouter`:

```tsx
'use client'
import { useRouter } from 'next/navigation';

const Component = () => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push('/dashboard');
    // router.back(), router.forward(), router.refresh()
  };
  
  return <button onClick={handleClick}>Navegar</button>;
};
```

## Middleware de Autenticação

O middleware em `middleware.ts` controla o acesso às rotas:

- Redireciona usuários não autenticados para `/sign-in`
- Verifica permissões para usuários autenticados
- Permite rotas públicas sem autenticação

## Layouts

### Layout Raiz
`src/app/layout.tsx` define o layout base da aplicação, incluindo:
- Configuração do ClerkProvider
- Configuração do tema
- Importação de estilos globais

### Layouts Específicos
- `src/app/(dashboard)/layout.tsx` - Layout do dashboard
- `src/app/(employee)/layout.tsx` - Layout para área de funcionários
- `src/app/client/layout.tsx` - Layout para área do cliente

## Páginas Dinâmicas

### Parâmetros
Para rotas com parâmetros, utilizar a convenção de pastas do Next.js:

```tsx
// src/app/clientes/[id]/page.tsx
export default function ClientePage({ params }: { params: { id: string } }) {
  return <div>Cliente ID: {params.id}</div>;
}
```

### Parâmetros de Busca
Acessar parâmetros de busca com `useSearchParams`:

```tsx
'use client'
import { useSearchParams } from 'next/navigation';

const Component = () => {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  
  return <div>Filtro: {filter}</div>;
};
```

## Carregamento de Dados

### Server Components
Utilizar Server Components para carregar dados no servidor:

```tsx
// Página que carrega dados do servidor
export default async function DashboardPage() {
  const data = await fetchData();
  
  return (
    <div>
      {/* Renderizar dados */}
    </div>
  );
}
```

### Client Components
Para dados que mudam com interação do usuário, utilizar Client Components:

```tsx
'use client'
import { useState, useEffect } from 'react';

export default function InteractiveComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return <div>{/* Renderizar dados */}</div>;
}
```

## Tratamento de Erros

### Error Boundaries
O Next.js fornece mecanismos para tratamento de erros:

- `error.tsx` - Para erros em rotas específicas
- `global-error.tsx` - Para erros globais
- `not-found.tsx` - Para páginas não encontradas

### Página 404
A página `not-found.tsx` é automaticamente utilizada quando uma rota não é encontrada.

## Otimizações

### Loading States
Implementar estados de loading com `loading.tsx`:

```tsx
// src/app/dashboard/loading.tsx
export default function Loading() {
  return <div>Carregando dashboard...</div>;
}
```

### Prefetching
O Next.js prefetch links automaticamente. Para desativar:

```tsx
<Link href="/dashboard" prefetch={false}>
  Dashboard
</Link>
```

## Internacionalização de Rotas

### Estratégia
As rotas podem ser internacionalizadas adicionando um prefixo de localidade:

- `/en/dashboard`
- `/pt/dashboard`

### Implementação
A implementação da i18n segue as diretrizes em `i18n.md`.

## Boas Práticas

### 1. Estrutura
- Organizar rotas logicamente em pastas
- Utilizar route groups para separar áreas da aplicação
- Manter URLs descritivas e consistentes

### 2. Performance
- Utilizar Server Components para dados estáticos
- Implementar loading states apropriados
- Utilizar prefetching para melhor experiência do usuário

### 3. Segurança
- Proteger rotas sensíveis no middleware
- Validar parâmetros de rota e busca
- Não expor dados sensíveis em URLs

### 4. Acessibilidade
- Utilizar títulos descritivos para páginas
- Implementar navegação por teclado
- Manter histórico de navegação consistente

### 5. Manutenção
- Documentar rotas complexas
- Utilizar convenções consistentes de nomenclatura
- Testar navegação entre rotas importantes