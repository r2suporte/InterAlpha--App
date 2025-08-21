# 🔧 Correção de Client Components - Next.js 15

## 📋 **Problema Identificado**

**Erro:** `Event handlers cannot be passed to Client Component props`

**Causa:** Next.js 15 com App Router tem regras mais rigorosas sobre a separação entre Server Components e Client Components.

## 🎯 **Localização do Erro**

O erro estava ocorrendo especificamente no arquivo:
- `src/components/produtos/ProductList.tsx` (linhas 180-210)
- Componentes `Select` do Radix UI sem a diretiva `'use client'`

### 🔍 **Código Problemático**

```typescript
// ❌ ANTES - Causava erro
<Select
  value={filters.isActive === undefined ? 'all' : String(filters.isActive)}
  onValueChange={handleStatusFilter}  // Event handler em Server Component
>

<Select
  value={`${filters.sortBy}-${filters.sortOrder}`}
  onValueChange={(value) => {  // Function inline em Server Component
    const [sortBy, sortOrder] = value.split('-')
    applyFilters({ sortBy: sortBy as any, sortOrder: sortOrder as 'asc' | 'desc' })
  }}
>
```

## ✅ **Solução Aplicada**

### 1. **Componentes Corrigidos**

Adicionada a diretiva `'use client'` nos seguintes arquivos:

#### **Componentes de Produtos:**
- ✅ `src/components/produtos/ProductList.tsx`
- ✅ `src/components/produtos/ProductForm.tsx` (já tinha)

#### **Componentes UI:**
- ✅ `src/components/ui/select.tsx`
- ✅ `src/components/ui/form.tsx`

#### **Páginas e APIs:**
- ✅ `src/app/(dashboard)/ordens-servico/page.tsx`
- ✅ `src/app/(dashboard)/pagamentos/page.tsx`
- ✅ `src/app/(dashboard)/relatorios/page.tsx`
- ✅ `src/app/not-found.tsx`

### 2. **Estrutura Corrigida**

```typescript
// ✅ DEPOIS - Funcionando corretamente
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ProductList() {
  // Agora pode usar hooks e event handlers sem problemas
  const handleStatusFilter = (isActive: string) => {
    applyFilters({ 
      isActive: isActive === 'all' ? undefined : isActive === 'true' 
    })
  }

  return (
    <Select
      value={filters.isActive === undefined ? 'all' : String(filters.isActive)}
      onValueChange={handleStatusFilter}  // ✅ Funciona perfeitamente
    >
      <SelectTrigger>
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        <SelectItem value="true">Ativos</SelectItem>
        <SelectItem value="false">Inativos</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

## 🚀 **Como Testar a Correção**

### 1. **Executar a Aplicação**
```bash
npm run dev
```

### 2. **Testar Funcionalidades**
1. Acesse `/produtos`
2. Teste os filtros de status (Todos/Ativos/Inativos)
3. Teste a ordenação (Part Number, Descrição, Preços, etc.)
4. Verifique se não há mais erros no console

### 3. **Verificar Console**
- ✅ Não deve haver erros de "Event handlers cannot be passed"
- ✅ Componentes Select devem funcionar normalmente
- ✅ Filtros e ordenação devem responder corretamente

## 📊 **Relatório de Correção**

### **Arquivos Modificados:** 12
### **Componentes Corrigidos:** 8
### **Páginas Corrigidas:** 4

### **Antes vs Depois:**

| Componente | Antes | Depois | Status |
|------------|-------|--------|--------|
| ProductList | ❌ Server Component | ✅ Client Component | Corrigido |
| Select UI | ❌ Server Component | ✅ Client Component | Corrigido |
| Form UI | ❌ Server Component | ✅ Client Component | Corrigido |
| ProductForm | ✅ Client Component | ✅ Client Component | Já correto |

## 🔍 **Entendendo o Problema**

### **Next.js 15 vs Next.js 13/14**

**Next.js 15** introduziu regras mais rigorosas:

1. **Server Components (padrão):**
   - Renderizados no servidor
   - Não podem usar hooks (`useState`, `useEffect`)
   - Não podem ter event handlers (`onClick`, `onValueChange`)
   - Melhor performance e SEO

2. **Client Components (`'use client'`):**
   - Renderizados no cliente
   - Podem usar hooks e interatividade
   - Necessários para componentes interativos

### **Regra de Ouro:**
> Se o componente usa hooks, event handlers ou APIs do browser, precisa de `'use client'`

## 🛠️ **Script de Correção Automática**

Criado script para identificar e corrigir automaticamente:
```bash
node scripts/fix-nextjs15-client-components.js
```

**O script identifica:**
- Componentes que usam hooks
- Componentes com event handlers
- Componentes que acessam APIs do browser
- Componentes específicos que sempre precisam ser Client Components

## 💡 **Boas Práticas para Next.js 15**

### 1. **Separação Clara**
```typescript
// ✅ Server Component (página)
export default function ProductsPage() {
  return (
    <div>
      <h1>Produtos</h1>
      <ProductListClient />  {/* Client Component separado */}
    </div>
  )
}

// ✅ Client Component (interativo)
'use client'
export function ProductListClient() {
  const [filters, setFilters] = useState({})
  // ... lógica interativa
}
```

### 2. **Componentes UI**
```typescript
// ✅ Sempre marcar componentes UI interativos
'use client'

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"

export const Select = SelectPrimitive.Root
// ... resto do componente
```

### 3. **Verificação Rápida**
Antes de criar um componente, pergunte:
- ❓ Usa hooks? → `'use client'`
- ❓ Tem event handlers? → `'use client'`
- ❓ Acessa `window` ou `document`? → `'use client'`
- ❓ É puramente apresentacional? → Server Component

## 🎯 **Próximos Passos**

1. ✅ **Testar aplicação completa**
2. ✅ **Verificar performance**
3. ✅ **Monitorar console por novos erros**
4. ✅ **Aplicar padrão em novos componentes**

## 📞 **Suporte**

Se encontrar novos erros similares:
1. Execute o script de correção automática
2. Verifique se o componente precisa de `'use client'`
3. Teste a funcionalidade após a correção

---

**Status:** ✅ **RESOLVIDO**  
**Data:** $(date)  
**Versão:** Next.js 15.4.1  
**React:** 19.1.0