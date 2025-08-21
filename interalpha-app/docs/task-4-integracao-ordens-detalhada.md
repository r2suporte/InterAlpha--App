# 🎯 Task 4: Integração Produtos com Ordens de Serviço
## Plano Detalhado de Implementação

---

## 📋 Visão Geral

**Objetivo**: Integrar o sistema de produtos com o sistema de ordens de serviço existente, permitindo que ordens incluam produtos além de serviços.

**Prioridade**: 🔥 **CRÍTICA**
**Estimativa**: 1-2 semanas
**Status**: ❌ **PENDENTE**

---

## 🔍 Análise Prévia Necessária

### **1. Revisar Schema Atual de OrdemServico**

Antes de iniciar, precisamos entender a estrutura atual:

```bash
# Verificar schema atual
cat prisma/schema.prisma | grep -A 20 "model OrdemServico"
```

**Campos esperados no modelo atual**:
- `id`, `clienteId`, `descricao`, `status`
- `valorServico`, `valorTotal`
- `dataInicio`, `dataFim`
- Relacionamentos existentes

### **2. Identificar Pontos de Integração**

**Locais que precisarão modificação**:
- [ ] Schema Prisma (`prisma/schema.prisma`)
- [ ] Serviços (`src/services/ordem-servico-service.ts`)
- [ ] APIs (`src/app/api/ordens/`)
- [ ] Componentes (`src/components/ordens/`)
- [ ] Páginas (`src/app/ordens/`)

---

## 🏗️ Implementação Detalhada

### **ETAPA 1: Modificações no Schema (Dia 1)**

#### **1.1 Adicionar Model OrderItem**

```typescript
// prisma/schema.prisma
model OrderItem {
  id          String      @id @default(cuid())
  ordemId     String
  productId   String
  quantity    Int         @default(1)
  unitPrice   Decimal     @db.Decimal(10,2)
  totalPrice  Decimal     @db.Decimal(10,2)
  description String?     // Descrição personalizada se necessário
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  // Relacionamentos
  ordem       OrdemServico @relation(fields: [ordemId], references: [id], onDelete: Cascade)
  product     Product     @relation(fields: [productId], references: [id])
  
  @@map("order_items")
  @@index([ordemId])
  @@index([productId])
}
```

#### **1.2 Modificar Model OrdemServico**

```typescript
// Adicionar ao model OrdemServico existente
model OrdemServico {
  // ... campos existentes
  
  // Novos campos para produtos
  items         OrderItem[]
  valorProdutos Decimal?    @db.Decimal(10,2) @default(0)
  // valorTotal já existe, será recalculado
  
  // ... resto do modelo
}
```

#### **1.3 Modificar Model Product**

```typescript
// Adicionar ao model Product existente
model Product {
  // ... campos existentes
  
  // Relacionamento com ordens
  orderItems    OrderItem[]
  
  // ... resto do modelo
}
```

#### **1.4 Criar Migration**

```bash
npx prisma migrate dev --name add-order-items
```

---

### **ETAPA 2: Serviços Backend (Dias 2-3)**

#### **2.1 Atualizar OrdemServicoService**

```typescript
// src/services/ordem-servico-service.ts

interface CreateOrdemServicoData {
  // ... campos existentes
  items?: {
    productId: string
    quantity: number
    unitPrice?: number // Se não fornecido, usar preço do produto
    description?: string
  }[]
}

class OrdemServicoService {
  // ... métodos existentes

  async create(data: CreateOrdemServicoData) {
    const { items, ...ordemData } = data
    
    // Calcular valores dos produtos
    let valorProdutos = 0
    const processedItems = []
    
    if (items && items.length > 0) {
      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })
        
        if (!product) {
          throw new Error(`Produto não encontrado: ${item.productId}`)
        }
        
        const unitPrice = item.unitPrice || product.salePrice
        const totalPrice = unitPrice * item.quantity
        
        processedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          description: item.description
        })
        
        valorProdutos += totalPrice
      }
    }
    
    // Calcular valor total
    const valorTotal = (ordemData.valorServico || 0) + valorProdutos
    
    // Criar ordem com itens
    const ordem = await prisma.ordemServico.create({
      data: {
        ...ordemData,
        valorProdutos,
        valorTotal,
        items: {
          create: processedItems
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        cliente: true
      }
    })
    
    return ordem
  }

  async update(id: string, data: Partial<CreateOrdemServicoData>) {
    const { items, ...ordemData } = data
    
    // Se items foram fornecidos, recalcular tudo
    if (items !== undefined) {
      // Deletar itens existentes
      await prisma.orderItem.deleteMany({
        where: { ordemId: id }
      })
      
      // Processar novos itens (mesmo código do create)
      // ... lógica similar ao create
    }
    
    // Atualizar ordem
    const ordem = await prisma.ordemServico.update({
      where: { id },
      data: ordemData,
      include: {
        items: {
          include: {
            product: true
          }
        },
        cliente: true
      }
    })
    
    return ordem
  }

  async findById(id: string) {
    return prisma.ordemServico.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        cliente: true
      }
    })
  }

  // Método para recalcular totais
  async recalculateTotals(ordemId: string) {
    const ordem = await this.findById(ordemId)
    if (!ordem) throw new Error('Ordem não encontrada')
    
    const valorProdutos = ordem.items.reduce(
      (sum, item) => sum + Number(item.totalPrice), 
      0
    )
    
    const valorTotal = Number(ordem.valorServico || 0) + valorProdutos
    
    return prisma.ordemServico.update({
      where: { id: ordemId },
      data: {
        valorProdutos,
        valorTotal
      }
    })
  }
}
```

#### **2.2 Criar OrderItemService**

```typescript
// src/services/order-item-service.ts

export class OrderItemService {
  async addItem(ordemId: string, itemData: {
    productId: string
    quantity: number
    unitPrice?: number
    description?: string
  }) {
    const product = await prisma.product.findUnique({
      where: { id: itemData.productId }
    })
    
    if (!product) {
      throw new Error('Produto não encontrado')
    }
    
    const unitPrice = itemData.unitPrice || product.salePrice
    const totalPrice = unitPrice * itemData.quantity
    
    const item = await prisma.orderItem.create({
      data: {
        ordemId,
        productId: itemData.productId,
        quantity: itemData.quantity,
        unitPrice,
        totalPrice,
        description: itemData.description
      },
      include: {
        product: true
      }
    })
    
    // Recalcular totais da ordem
    await new OrdemServicoService().recalculateTotals(ordemId)
    
    return item
  }

  async updateItem(itemId: string, data: {
    quantity?: number
    unitPrice?: number
    description?: string
  }) {
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { product: true }
    })
    
    if (!item) throw new Error('Item não encontrado')
    
    const quantity = data.quantity || item.quantity
    const unitPrice = data.unitPrice || item.unitPrice
    const totalPrice = unitPrice * quantity
    
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        ...data,
        totalPrice
      },
      include: {
        product: true
      }
    })
    
    // Recalcular totais da ordem
    await new OrdemServicoService().recalculateTotals(item.ordemId)
    
    return updatedItem
  }

  async removeItem(itemId: string) {
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId }
    })
    
    if (!item) throw new Error('Item não encontrado')
    
    await prisma.orderItem.delete({
      where: { id: itemId }
    })
    
    // Recalcular totais da ordem
    await new OrdemServicoService().recalculateTotals(item.ordemId)
    
    return { success: true }
  }
}
```

---

### **ETAPA 3: APIs (Dia 4)**

#### **3.1 Atualizar API de Ordens**

```typescript
// src/app/api/ordens/route.ts

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, ...ordemData } = body
    
    // Validar dados da ordem
    const validatedData = ordemServicoSchema.parse(ordemData)
    
    // Validar itens se fornecidos
    if (items) {
      const itemsSchema = z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().optional(),
        description: z.string().optional()
      }))
      
      const validatedItems = itemsSchema.parse(items)
      validatedData.items = validatedItems
    }
    
    const ordemService = new OrdemServicoService()
    const ordem = await ordemService.create(validatedData)
    
    return NextResponse.json(ordem, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar ordem:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
```

#### **3.2 Criar API para Itens**

```typescript
// src/app/api/ordens/[id]/items/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const itemService = new OrderItemService()
    
    const item = await itemService.addItem(params.id, body)
    
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

// src/app/api/ordens/[id]/items/[itemId]/route.ts

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, itemId: string } }
) {
  try {
    const body = await request.json()
    const itemService = new OrderItemService()
    
    const item = await itemService.updateItem(params.itemId, body)
    
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, itemId: string } }
) {
  try {
    const itemService = new OrderItemService()
    
    await itemService.removeItem(params.itemId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
```

---

### **ETAPA 4: Componentes Frontend (Dias 5-7)**

#### **4.1 Componente OrderProductSelector**

```typescript
// src/components/ordens/OrderProductSelector.tsx

interface OrderItem {
  id?: string
  productId: string
  product?: Product
  quantity: number
  unitPrice: number
  totalPrice: number
  description?: string
}

interface OrderProductSelectorProps {
  selectedItems: OrderItem[]
  onItemsChange: (items: OrderItem[]) => void
  disabled?: boolean
}

export function OrderProductSelector({
  selectedItems,
  onItemsChange,
  disabled = false
}: OrderProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Buscar produtos
  const searchProducts = useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setProducts([])
        return
      }
      
      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/produtos?search=${encodeURIComponent(term)}&limit=10`
        )
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Erro ao buscar produtos:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300),
    []
  )
  
  useEffect(() => {
    searchProducts(searchTerm)
  }, [searchTerm, searchProducts])
  
  const addProduct = (product: Product) => {
    const existingItem = selectedItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      // Incrementar quantidade
      updateItemQuantity(existingItem, existingItem.quantity + 1)
    } else {
      // Adicionar novo item
      const newItem: OrderItem = {
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: product.salePrice,
        totalPrice: product.salePrice
      }
      
      onItemsChange([...selectedItems, newItem])
    }
    
    setSearchTerm('')
    setProducts([])
  }
  
  const updateItemQuantity = (item: OrderItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item)
      return
    }
    
    const updatedItems = selectedItems.map(i => 
      i.productId === item.productId
        ? { 
            ...i, 
            quantity: newQuantity,
            totalPrice: i.unitPrice * newQuantity
          }
        : i
    )
    
    onItemsChange(updatedItems)
  }
  
  const updateItemPrice = (item: OrderItem, newPrice: number) => {
    const updatedItems = selectedItems.map(i => 
      i.productId === item.productId
        ? { 
            ...i, 
            unitPrice: newPrice,
            totalPrice: newPrice * i.quantity
          }
        : i
    )
    
    onItemsChange(updatedItems)
  }
  
  const removeItem = (item: OrderItem) => {
    const updatedItems = selectedItems.filter(i => i.productId !== item.productId)
    onItemsChange(updatedItems)
  }
  
  const totalValue = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
  
  return (
    <div className="space-y-4">
      {/* Busca de Produtos */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar produtos por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={disabled}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {/* Implementar scanner */}}
            disabled={disabled}
          >
            <QrCode className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Resultados da busca */}
        {products.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                onClick={() => addProduct(product)}
                disabled={disabled}
              >
                <div className="font-medium">{product.partNumber}</div>
                <div className="text-sm text-gray-600">{product.description}</div>
                <div className="text-sm font-medium text-green-600">
                  R$ {product.salePrice.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Lista de Itens Selecionados */}
      {selectedItems.length > 0 && (
        <div className="border rounded-lg">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-medium">Produtos Selecionados</h3>
          </div>
          
          <div className="divide-y">
            {selectedItems.map((item, index) => (
              <div key={item.productId} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.product?.partNumber || item.productId}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.product?.description}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Quantidade */}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item, item.quantity - 1)}
                        disabled={disabled}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item, parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                        min="1"
                        disabled={disabled}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item, item.quantity + 1)}
                        disabled={disabled}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Preço Unitário */}
                    <div className="w-24">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItemPrice(item, parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        disabled={disabled}
                        className="text-right"
                      />
                    </div>
                    
                    {/* Total */}
                    <div className="w-20 text-right font-medium">
                      R$ {item.totalPrice.toFixed(2)}
                    </div>
                    
                    {/* Remover */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Total */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center font-medium">
              <span>Total dos Produtos:</span>
              <span className="text-lg">R$ {totalValue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

#### **4.2 Integrar no Formulário de Ordem**

```typescript
// src/components/ordens/OrdemServicoForm.tsx

export function OrdemServicoForm({ ordem, onSubmit }: OrdemServicoFormProps) {
  const [formData, setFormData] = useState({
    // ... campos existentes
    items: ordem?.items || []
  })
  
  const handleItemsChange = (items: OrderItem[]) => {
    setFormData(prev => ({ ...prev, items }))
  }
  
  const valorProdutos = formData.items.reduce((sum, item) => sum + item.totalPrice, 0)
  const valorTotal = (formData.valorServico || 0) + valorProdutos
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos existentes */}
      
      {/* Seção de Produtos */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Produtos</h3>
        
        <OrderProductSelector
          selectedItems={formData.items}
          onItemsChange={handleItemsChange}
        />
      </div>
      
      {/* Resumo de Valores */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Valor dos Serviços:</span>
          <span>R$ {(formData.valorServico || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Valor dos Produtos:</span>
          <span>R$ {valorProdutos.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Valor Total:</span>
          <span>R$ {valorTotal.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Botões */}
    </form>
  )
}
```

---

### **ETAPA 5: Testes (Dias 8-10)**

#### **5.1 Testes Unitários**

```typescript
// src/services/__tests__/ordem-servico-service.test.ts

describe('OrdemServicoService', () => {
  describe('create', () => {
    it('deve criar ordem com produtos', async () => {
      const mockProduct = {
        id: 'prod-1',
        salePrice: 100
      }
      
      const ordemData = {
        clienteId: 'client-1',
        descricao: 'Teste',
        valorServico: 200,
        items: [
          {
            productId: 'prod-1',
            quantity: 2
          }
        ]
      }
      
      const result = await ordemService.create(ordemData)
      
      expect(result.valorProdutos).toBe(200) // 2 * 100
      expect(result.valorTotal).toBe(400) // 200 + 200
      expect(result.items).toHaveLength(1)
    })
  })
})
```

#### **5.2 Testes de Integração**

```typescript
// src/app/api/ordens/__tests__/route.test.ts

describe('/api/ordens', () => {
  it('deve criar ordem com produtos via API', async () => {
    const response = await request(app)
      .post('/api/ordens')
      .send({
        clienteId: 'client-1',
        descricao: 'Teste API',
        valorServico: 150,
        items: [
          {
            productId: 'prod-1',
            quantity: 1
          }
        ]
      })
      
    expect(response.status).toBe(201)
    expect(response.body.valorProdutos).toBeGreaterThan(0)
    expect(response.body.items).toHaveLength(1)
  })
})
```

#### **5.3 Testes E2E**

```typescript
// e2e/ordem-com-produtos.spec.ts

test('deve criar ordem com produtos', async ({ page }) => {
  await page.goto('/ordens/nova')
  
  // Preencher dados básicos
  await page.fill('[data-testid="cliente-select"]', 'Cliente Teste')
  await page.fill('[data-testid="descricao"]', 'Ordem com produtos')
  await page.fill('[data-testid="valor-servico"]', '100')
  
  // Adicionar produto
  await page.fill('[data-testid="product-search"]', 'Produto Teste')
  await page.click('[data-testid="product-result-0"]')
  
  // Verificar cálculos
  const valorTotal = await page.textContent('[data-testid="valor-total"]')
  expect(valorTotal).toContain('R$ 150,00') // 100 + 50 (produto)
  
  // Salvar
  await page.click('[data-testid="submit-button"]')
  
  // Verificar redirecionamento e dados
  await expect(page).toHaveURL(/\/ordens\/\w+/)
})
```

---

## ✅ Critérios de Aceitação

### **Funcionais**
- [ ] Ordens podem incluir produtos além de serviços
- [ ] Cálculo automático de totais (produtos + serviços)
- [ ] Interface intuitiva para seleção de produtos
- [ ] Busca de produtos por nome/código funcional
- [ ] Edição de quantidade e preço unitário
- [ ] Remoção de produtos da ordem
- [ ] Validação de produtos existentes

### **Técnicos**
- [ ] Schema de banco atualizado com migrations
- [ ] APIs REST funcionais para CRUD de itens
- [ ] Testes unitários com >90% cobertura
- [ ] Testes de integração passando
- [ ] Performance adequada (<200ms nas APIs)
- [ ] Validações de dados robustas

### **UX/UI**
- [ ] Interface responsiva e intuitiva
- [ ] Feedback visual para ações do usuário
- [ ] Estados de loading e erro tratados
- [ ] Cálculos em tempo real
- [ ] Confirmações para ações destrutivas

---

## 🚨 Riscos e Mitigações

### **Risco 1: Quebra de Funcionalidades Existentes**
- **Mitigação**: Testes de regressão extensivos
- **Plano B**: Feature flag para rollback rápido

### **Risco 2: Performance com Muitos Itens**
- **Mitigação**: Paginação e lazy loading
- **Plano B**: Limite máximo de itens por ordem

### **Risco 3: Complexidade da Interface**
- **Mitigação**: Prototipagem e testes de usabilidade
- **Plano B**: Interface simplificada em primeira versão

---

## 📋 Checklist de Execução

### **Preparação**
- [ ] Backup completo do banco de dados
- [ ] Ambiente de desenvolvimento configurado
- [ ] Testes de regressão preparados

### **Implementação**
- [ ] Schema atualizado e migration executada
- [ ] Serviços backend implementados
- [ ] APIs criadas e testadas
- [ ] Componentes frontend desenvolvidos
- [ ] Integração com formulário existente

### **Testes**
- [ ] Testes unitários implementados
- [ ] Testes de integração passando
- [ ] Testes E2E funcionais
- [ ] Testes de performance realizados

### **Deploy**
- [ ] Code review aprovado
- [ ] Deploy em staging realizado
- [ ] Testes em staging passando
- [ ] Deploy em produção com feature flag

---

**📅 Início Planejado**: Próxima segunda-feira
**👥 Equipe**: 1 desenvolvedor senior + 1 desenvolvedor junior
**🔄 Reviews**: Diárias às 9h e 17h

---

*Este documento será atualizado conforme o progresso da implementação.*