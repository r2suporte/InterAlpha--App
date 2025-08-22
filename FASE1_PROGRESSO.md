# Fase 1: Correção de Testes - Progresso

## Status Atual
Após remover a dependência do Vitest e padronizar para Jest, os testes ainda estão falhando, mas com problemas diferentes e mais específicos. Isso indica que estamos no caminho certo, pois os erros agora são mais focados em problemas reais de implementação em vez de conflitos de framework.

## Problemas Identificados

### 1. Problemas com Next.js API Routes
- `ReferenceError: Request is not defined` em testes de API routes
- Erros de parsing em arquivos que usam sintaxe não padrão

### 2. Problemas de Mock
- `TypeError: Cannot read properties of undefined (reading 'mockResolvedValue')` 
- Problemas com mocks de funções Prisma
- Erros em mocks do Clerk

### 3. Problemas com Funções Ausentes
- `TypeError: (0 , _productutils.enrichProductWithCalculations) is not a function`
- Funções esperadas mas não implementadas

### 4. Problemas de Renderização
- `Invalid hook call` em testes de componentes
- Erros de seletores em testes de UI

## Plano de Ação para Correção

### Etapa 1: Corrigir Problemas de Ambiente (Prioridade Alta)

#### 1.1. Configurar ambiente JSDOM para Next.js
```javascript
// Atualizar jest.setup.js
// Adicionar polyfills para Request, Response e outras APIs do Next.js
Object.defineProperty(globalThis, 'Request', {
  value: class Request {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init?.method || 'GET'
      this.headers = new Map()
    }
  },
  writable: true,
  enumerable: true,
  configurable: true
})

Object.defineProperty(globalThis, 'Response', {
  value: class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Map()
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body))
    }
    
    text() {
      return Promise.resolve(this.body)
    }
  },
  writable: true,
  enumerable: true,
  configurable: true
})
```

#### 1.2. Corrigir problemas de hooks do React
```javascript
// Adicionar ao jest.setup.js
// Mock completo do React para evitar Invalid hook call
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useContext: jest.fn(),
  useRef: jest.fn(),
  useCallback: jest.fn(),
  useMemo: jest.fn(),
  useReducer: jest.fn(),
  useImperativeHandle: jest.fn(),
  useLayoutEffect: jest.fn(),
  useDebugValue: jest.fn(),
  useDeferredValue: jest.fn(),
  useTransition: jest.fn(),
  useId: jest.fn(),
  useSyncExternalStore: jest.fn(),
  useInsertionEffect: jest.fn(),
  useOptimistic: jest.fn(),
  useActionState: jest.fn(),
}))
```

### Etapa 2: Corrigir Problemas de Mock (Prioridade Alta)

#### 2.1. Corrigir mocks do Prisma
```javascript
// Exemplo de correção para testes do prisma
// Substituir:
;(prisma.ordemServico.findUnique as jest.Mock).mockResolvedValue(mockOrdemCompleta)

// Por:
jest.spyOn(prisma.ordemServico, 'findUnique').mockResolvedValue(mockOrdemCompleta)
```

#### 2.2. Corrigir mocks do Clerk
```javascript
// Atualizar mock do Clerk em jest.setup.js
jest.mock('@clerk/nextjs/server', () => ({
  auth: () => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    orgId: 'test-org-id',
    orgRole: 'admin',
    orgSlug: 'test-org',
    orgPermissions: [],
    has: jest.fn().mockReturnValue(true),
    hasPermission: jest.fn().mockReturnValue(true),
    hasRole: jest.fn().mockReturnValue(true),
  }),
  currentUser: () => Promise.resolve({
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    imageUrl: 'https://example.com/avatar.png',
  }),
  // Adicionar outros mocks necessários
}))
```

### Etapa 3: Corrigir Problemas de Funções Ausentes (Prioridade Média)

#### 3.1. Implementar funções faltando
```typescript
// Criar ou corrigir função enrichProductWithCalculations
// Em src/lib/utils/product-utils.ts
export function enrichProductWithCalculations(product: any) {
  // Implementar lógica de cálculo de margem, lucro, etc.
  return {
    ...product,
    profitMargin: calculateProfitMargin(product.costPrice, product.salePrice),
    profit: calculateProfit(product.costPrice, product.salePrice),
    // Outros cálculos necessários
  }
}

function calculateProfitMargin(costPrice: number, salePrice: number): number {
  if (costPrice <= 0) return 0
  return ((salePrice - costPrice) / costPrice) * 100
}

function calculateProfit(costPrice: number, salePrice: number): number {
  return salePrice - costPrice
}
```

### Etapa 4: Corrigir Problemas de Renderização (Prioridade Média)

#### 4.1. Corrigir testes de componentes
```typescript
// Exemplo de correção para testes de componentes
// Em vez de:
render(<Component />)

// Usar:
render(
  <ClerkProvider>
    <Component />
  </ClerkProvider>
)
```

#### 4.2. Corrigir seletores de teste
```typescript
// Em vez de procurar por texto exato:
expect(screen.getByText('50%')).toBeInTheDocument()

// Usar seletores mais flexíveis:
expect(screen.getByText(/50%/i)).toBeInTheDocument()
// ou
expect(screen.getByRole('status', { name: /margem/i })).toBeInTheDocument()
```

## Implementação

Vamos começar com as correções de ambiente e mocks, que são os problemas mais críticos.