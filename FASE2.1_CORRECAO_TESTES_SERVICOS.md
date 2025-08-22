# Plano de Correção dos Testes - Fase 2.1

## Objetivo
Corrigir os testes de serviços principais que estão falhando, priorizando os testes mais críticos para a funcionalidade do sistema.

## Testes a Serem Corrigidos

### 1. src/lib/services/__tests__/product-service.test.ts
**Status**: Falhando
**Erros Principais**:
- Problemas com mocks do Prisma
- Erros de importação de módulos
- Funções esperadas mas não implementadas

**Abordagem de Correção**:
1. Padronizar mocks do Prisma usando `jest.mock`
2. Corrigir problemas de importação
3. Implementar funções faltando no ProductService
4. Atualizar chamadas de teste para usar padrões Jest corretos

### 2. src/app/api/produtos/__tests__/route.test.ts
**Status**: Falhando
**Erros Principais**:
- Erros de sintaxe (`missing ) after argument list`)
- Problemas com imports do Clerk
- Erros de mock de módulos

**Abordagem de Correção**:
1. Corrigir erros de sintaxe
2. Padronizar imports do Clerk para Jest
3. Corrigir mocks de módulos usando `jest.mock`
4. Atualizar chamadas de teste para usar padrões Jest corretos

### 3. src/app/api/produtos/__tests__/produtos.test.ts
**Status**: Falhando
**Erros Principais**:
- Erros de sintaxe (`missing ) after argument list`)
- Problemas com imports do Clerk
- Erros de mock de módulos

**Abordagem de Correção**:
1. Corrigir erros de sintaxe
2. Padronizar imports do Clerk para Jest
3. Corrigir mocks de módulos usando `jest.mock`
4. Atualizar chamadas de teste para usar padrões Jest corretos

## Estratégia de Correção

### Etapa 1: Correção de Mocks do Prisma (2-3 horas)

#### Tarefa 1.1: Padronizar Mocks do Prisma
```javascript
// Antes (problemas com casting e mockResolvedValue)
;(prisma.ordemServico.findUnique as jest.Mock).mockResolvedValue(mockOrdemCompleta)

// Depois (padrão Jest correto)
jest.spyOn(prisma.ordemServico, 'findUnique').mockResolvedValue(mockOrdemCompleta)
```

#### Tarefa 1.2: Corrigir Problemas de Importação
```javascript
// Antes (problemas com importações)
import { POST, GET } from '../route'

// Depois (corrigir caminhos e resolver problemas de importação)
import * as routeHandlers from '../route'
const { POST, GET } = routeHandlers
```

### Etapa 2: Correção de Erros de Sintaxe (1-2 horas)

#### Tarefa 2.1: Corrigir Erros de Sintaxe em Arquivos de Teste
```javascript
// Antes (erro de sintaxe)
const mockAuth = jest.mocked(await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("@clerk/nextjs/server")))).auth;

// Depois (correção de sintaxe)
const mockAuth = jest.mocked((await import('@clerk/nextjs/server')).auth);
```

### Etapa 3: Correção de Mocks do Clerk (1-2 horas)

#### Tarefa 3.1: Padronizar Mocks do Clerk
```javascript
// Antes (problemas com mock)
jest.mock('@clerk/nextjs/server', () => ({
  auth: () => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
  }),
}))

// Depois (mock padronizado)
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
  })),
}))
```

### Etapa 4: Correção de Testes de Serviços (3-4 horas)

#### Tarefa 4.1: Corrigir Testes do ProductService
1. Atualizar mocks do Prisma para usar `jest.spyOn` em vez de casting
2. Corrigir chamadas para `mockResolvedValue` e `mockRejectedValue`
3. Padronizar estrutura dos testes
4. Corrigir problemas de importação

#### Tarefa 4.2: Corrigir Testes de API Routes
1. Corrigir erros de sintaxe
2. Padronizar mocks de dependências
3. Atualizar chamadas para usar `jest.fn()` corretamente
4. Corrigir problemas de importação

## Implementação

### Correção do ProductService Test

```typescript
// src/lib/services/__tests__/product-service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals'
import { ProductService } from '../product-service'
import { PrismaClient } from '@prisma/client'

// Mock do Prisma
const mockPrisma = {
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  $transaction: jest.fn()
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

describe('ProductService', () => {
  beforeEach(() => {
    // Resetar todos os mocks antes de cada teste
    vi.clearAllMocks()
    
    // Resetar implementações padrão dos mocks
    Object.values(mockPrisma.product).forEach((method: any) => {
      if (typeof method === 'function') {
        method.mockReset()
      }
    })
    
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrisma)
    })
  })

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = {
        partNumber: 'TEST-001',
        description: 'Produto de teste',
        costPrice: 50.00,
        salePrice: 75.00
      }

      const mockCreatedProduct = {
        id: 'product-1',
        ...productData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      }

      // Mock do findUnique para verificar se partNumber já existe
      mockPrisma.product.findUnique.mockResolvedValue(null)
      
      // Mock do create para retornar produto criado
      mockPrisma.product.create.mockResolvedValue(mockCreatedProduct)

      const result = await ProductService.createProduct(productData, 'user-1')

      expect(result).toEqual(mockCreatedProduct)
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { partNumber: productData.partNumber }
      })
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          ...productData,
          isActive: true,
          createdBy: 'user-1'
        }
      })
    })
  })
})
```

### Correção dos Testes de API Routes

```typescript
// src/app/api/produtos/__tests__/route.test.ts
import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import * as routeHandlers from '../route'
import { ProductService } from '@/lib/services/product-service'
import { NextRequest } from 'next/server'

// Mock das dependências
const mockAuth = jest.fn()
jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth()
}))

jest.mock('@/lib/services/product-service', () => ({
  ProductService: {
    getProducts: jest.fn()
  }
}))

const { GET, POST } = routeHandlers

describe('/api/produtos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockReturnValue({ userId: 'user-123' })
  })

  describe('GET', () => {
    it('should return products with default pagination', async () => {
      const mockResult = {
        products: [
          {
            id: 'product-1',
            partNumber: 'TEST-001',
            description: 'Produto de teste',
            costPrice: 50.00,
            salePrice: 75.00,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'user-1'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
          hasNext: false,
          hasPrev: false
        }
      }

      ;(ProductService.getProducts as jest.Mock).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/produtos')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockResult.products)
      expect(data.pagination).toEqual(mockResult.pagination)
    })
  })
})
```

## Critérios de Sucesso

1. Todos os 3 testes de serviços devem passar
2. Nenhum teste existente deve quebrar
3. Código deve seguir padrões Jest corretos
4. Mocks devem ser padronizados e reutilizáveis
5. Tempo de execução dos testes deve permanecer aceitável

## Próximos Passos

1. Implementar correções nos arquivos de teste
2. Executar testes para validar correções
3. Ajustar conforme necessário
4. Documentar padrões de teste para uso futuro
5. Preparar para Fase 2.2: Correção de Testes de Componentes