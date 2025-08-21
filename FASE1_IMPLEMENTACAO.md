# Fase 1: Implementação - Padronização para Jest

## Status Atual
Após a remoção da dependência do Vitest, ainda temos diversos problemas nos testes que precisam ser corrigidos. A padronização para Jest está em andamento, mas requer correções adicionais.

## Problemas Identificados

### 1. Testes com Referências a Vitest
Mesmo após remover a dependência, alguns testes ainda possuem:
- Referências a `vi.mock` e `vi.fn`
- Importações de `vitest`

### 2. Problemas de Sintaxe
- Uso incorreto de `await` em funções síncronas
- Código gerado automaticamente com referências a `_vitest`

### 3. Problemas de Mock
- Mocks mal configurados com `jest.Mock`
- Problemas com funções do Prisma não sendo mockadas corretamente

### 4. Problemas de Ambiente
- `ReferenceError: Request is not defined`
- Funções ausentes em módulos (`enrichProductWithCalculations`)

## Plano de Correção

### Etapa 1: Corrigir Referências a Vitest

#### 1.1. Atualizar testes com `vi.mock`
Converter referências de `vi.mock` para `jest.mock`:

```javascript
// Antes (Vitest)
vi.mock('@/components/produtos/ProductsStats', () => ({
  default: () => <div data-testid="products-stats">ProductsStats</div>
}))

// Depois (Jest)
jest.mock('@/components/produtos/ProductsStats', () => ({
  __esModule: true,
  default: () => <div data-testid="products-stats">ProductsStats</div>
}))
```

#### 1.2. Atualizar testes com `vi.fn()`
Converter referências de `vi.fn()` para `jest.fn()`:

```javascript
// Antes (Vitest)
global.fetch = vi.fn()

// Depois (Jest)
global.fetch = jest.fn()
```

### Etapa 2: Corrigir Problemas de Sintaxe

#### 2.1. Corrigir uso incorreto de `await`
Remover `await` de funções síncronas:

```javascript
// Antes (com erro)
const { existsSync } = vi.mocked(await import('fs'))

// Depois (corrigido)
const { existsSync } = require('fs')
// ou
const fs = require('fs')
const { existsSync } = fs
```

### Etapa 3: Corrigir Problemas de Mock

#### 3.1. Corrigir mocks do Prisma
Atualizar mocks do Prisma para usar `jest.fn()` corretamente:

```javascript
// Antes (com erro)
;(prisma.ordemServico.findUnique as jest.Mock).mockResolvedValue(mockOrdemCompleta)

// Depois (corrigido)
jest.spyOn(prisma.ordemServico, 'findUnique').mockResolvedValue(mockOrdemCompleta)
```

#### 3.2. Corrigir funções ausentes
Para funções como `enrichProductWithCalculations` que estão faltando, precisamos:

1. Verificar se existem nos arquivos originais
2. Criar mocks apropriados se necessário
3. Corrigir importações

### Etapa 4: Corrigir Problemas de Ambiente

#### 4.1. Problema do `Request is not defined`
Adicionar polyfills necessários no `jest.setup.js`:

```javascript
// Adicionar ao jest.setup.js
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
```

## Implementação

Vamos começar corrigindo os problemas mais críticos e seguir uma abordagem sistemática para resolver os testes.