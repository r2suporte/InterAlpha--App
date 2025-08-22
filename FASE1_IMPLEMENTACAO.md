# Fase 1: Remoção do Vitest e Padronização para Jest

## Status Atual
Após a remoção do Vitest e padronização para Jest, os testes ainda estão falhando, mas com problemas mais específicos e identificáveis. Isso indica que estamos no caminho certo, pois os erros agora são mais focados em problemas reais de implementação em vez de conflitos de framework.

## Problemas Identificados

### 1. Problemas de Ambiente e Configuração
- `ReferenceError: Request is not defined` em testes de API routes
- Erros de parsing em arquivos que usam sintaxe não padrão
- Problemas com ambientes de teste para componentes React

### 2. Problemas de Mock
- `TypeError: Cannot read properties of undefined (reading 'mockResolvedValue')` 
- Problemas com mocks de funções Prisma
- Erros em mocks do Clerk
- Problemas com mocks de módulos do sistema (fs, etc.)

### 3. Problemas com Funções Ausentes
- `TypeError: (0 , _productutils.enrichProductWithCalculations) is not a function`
- Funções esperadas mas não implementadas

### 4. Problemas de Renderização
- `Invalid hook call` em testes de componentes
- Erros de seletores em testes de UI
- Problemas com hooks do React (`useState`, `useEffect`, etc.)

## Plano de Ação

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
  // Adicionar outros mocks necessários
}))
```

#### 2.3. Corrigir mocks de módulos do sistema
```javascript
// Corrigir mocks de fs e outros módulos do sistema
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
  }
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

### Passo 1: Atualizar jest.setup.js com polyfills e mocks

Vamos começar atualizando o arquivo jest.setup.js com os polyfills e mocks necessários: