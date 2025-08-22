# Gerenciamento de Estado

## Visão Geral

O InterAlpha utiliza uma combinação de diferentes soluções para gerenciamento de estado, dependendo do escopo e da complexidade dos dados:

1. **React Context** - Para estado global da aplicação
2. **React State (useState/useReducer)** - Para estado local de componentes
3. **Server Components** - Para dados que não mudam com frequência
4. **URL Params/Search Params** - Para estado de UI relacionado à navegação

## React Context

### Implementação
- Contextos são definidos na pasta `src/contexts/`
- Cada contexto tem seu próprio provider
- Providers são combinados em `src/contexts/AppProviders.tsx`

### Boas Práticas
- Criar contextos para dados que são utilizados por múltiplos componentes
- Evitar contextos muito grandes - dividir em contextos menores e mais específicos
- Utilizar `useContext` apenas em componentes que realmente precisam dos dados
- Atualizar estado de forma imutável

### Exemplo de Implementação

```typescript
// src/contexts/UserContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
```

## Estado Local de Componentes

### useState
- Utilizado para estado simples e local
- Adequado para formulários, toggles, estados de UI

### useReducer
- Utilizado para estado complexo com múltiplas ações
- Quando o estado tem múltiplas sub-propriedades que mudam juntas
- Quando as atualizações de estado seguem padrões específicos

## Server Components

### Vantagens
- Dados carregados diretamente do servidor
- Nenhum JavaScript do lado do cliente para gerenciamento de estado
- Performance otimizada pelo Next.js

### Casos de Uso
- Páginas com dados estáticos ou que mudam raramente
- Listas de itens que não requerem interação complexa
- Dados que são carregados uma vez e não mudam durante a sessão

## Estado de UI e Navegação

### URL como Fonte de Verdade
- Estados de filtro, paginação e busca são mantidos na URL
- Permite compartilhamento de URLs com estado
- Facilita o uso do botão "voltar" do navegador

### Exemplo
```typescript
// Utilizar router do Next.js para manter estado na URL
const router = useRouter();
const searchParams = useSearchParams();

const handleFilterChange = (filter: string) => {
  const params = new URLSearchParams(searchParams);
  params.set('filter', filter);
  router.push(`?${params.toString()}`);
};
```

## Práticas Recomendadas

### 1. Minimizar Re-renderizações
- Utilizar React.memo para componentes que renderizam frequentemente
- Memoizar valores e funções com useMemo e useCallback
- Evitar colocar funções no estado - passá-las como props

### 2. Estrutura de Estado
- Manter o estado o mais "plano" possível
- Normalizar dados quando apropriado
- Evitar estado duplicado - calcular valores quando necessário

### 3. Atualizações de Estado
- Tratar estado como imutável
- Utilizar funções de atualização para estado baseado no valor anterior
- Agrupar atualizações relacionadas

```typescript
// ✅ Bom
setUser(prevUser => ({
  ...prevUser,
  name: newName
}));

// ❌ Ruim
user.name = newName;
setUser(user);
```

### 4. Seletores
- Criar funções seletoras para derivar dados do estado
- Memoizar seletores complexos
- Manter lógica de transformação de dados separada dos componentes

### 5. Gerenciamento de Formulários
- Utilizar React Hook Form para formulários complexos
- Manter estado de formulários separado do estado global quando apropriado
- Validar dados no cliente e no servidor

### 6. Estado de Loading e Erros
- Sempre tratar estados de loading e erro
- Utilizar estado global para indicadores de loading da aplicação
- Mostrar mensagens de erro amigáveis ao usuário

### 7. Persistência de Estado
- Utilizar localStorage/sessionStorage para estado que deve persistir
- Sincronizar estado persistido com o estado da aplicação
- Limpar dados persistentes quando apropriado (logout, expiração)