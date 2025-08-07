# Design - Fase 2: Gestão de Clientes

## Overview

Esta fase implementa o sistema completo de gestão de clientes com CRUD, validações brasileiras (CPF/CNPJ, CEP) e interface otimizada para produtividade.

## Architecture

### Estrutura de Rotas
```
/clientes                    # Lista de clientes
/clientes/novo              # Formulário de novo cliente
/clientes/[id]              # Detalhes do cliente
/clientes/[id]/editar       # Formulário de edição
```

### Fluxo de Dados
```
Cliente → Validação → API → Banco de Dados → UI
```

## Components and Interfaces

### Páginas Principais

#### Lista de Clientes (`/clientes/page.tsx`)
```tsx
interface ClientesPageProps {
  searchParams: {
    page?: string
    search?: string
    sort?: string
  }
}

// Funcionalidades:
// - Listagem paginada
// - Busca em tempo real
// - Ordenação por colunas
// - Botão "Novo Cliente"
// - Estado vazio quando sem clientes
```

#### Formulário de Cliente (`/clientes/novo/page.tsx`)
```tsx
interface ClienteFormData {
  nome: string
  email: string
  telefone?: string
  documento: string
  tipoDocumento: 'CPF' | 'CNPJ'
  cep: string
  endereco?: string
  cidade?: string
  estado?: string
  observacoes?: string
}

// Validações:
// - CPF/CNPJ em tempo real
// - Email válido
// - CEP com busca automática
// - Campos obrigatórios
```

#### Detalhes do Cliente (`/clientes/[id]/page.tsx`)
```tsx
interface ClienteDetalhesProps {
  cliente: Cliente
  ordensServico: OrdemServico[]
}

// Seções:
// - Informações pessoais
// - Dados de contato
// - Endereço
// - Histórico de O.S.
// - Ações (editar, excluir)
```

### Componentes Reutilizáveis

#### ClienteCard
```tsx
interface ClienteCardProps {
  cliente: Cliente
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
}

// Layout:
// - Avatar com iniciais
// - Nome e documento
// - Email e telefone
// - Menu de ações
```

#### ClienteForm
```tsx
interface ClienteFormProps {
  cliente?: Cliente
  onSubmit: (data: ClienteFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

// Funcionalidades:
// - Validação em tempo real
// - Busca de CEP
// - Formatação de campos
// - Estados de loading
```

#### SearchBar
```tsx
interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Funcionalidades:
// - Debounce para performance
// - Ícone de busca
// - Clear button
// - Keyboard shortcuts
```

## Data Models

### Cliente (Prisma Schema)
```prisma
model Cliente {
  id            String   @id @default(cuid())
  nome          String
  email         String
  telefone      String?
  documento     String   @unique
  tipoDocumento TipoDocumento
  cep           String?
  endereco      String?
  cidade        String?
  estado        String?
  observacoes   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relacionamentos
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  ordensServico OrdemServico[]
  
  @@map("clientes")
}

enum TipoDocumento {
  CPF
  CNPJ
}
```

### Validação de Formulário (Zod)
```typescript
const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  documento: z.string().min(11, 'Documento inválido'),
  tipoDocumento: z.enum(['CPF', 'CNPJ']),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2, 'Estado deve ter 2 caracteres').optional(),
  observacoes: z.string().optional(),
})
```

## Error Handling

### Validações de Campo
1. **CPF/CNPJ**: Validação matemática + verificação de dígitos
2. **Email**: Regex + verificação de domínio
3. **CEP**: Formato + consulta à API dos Correios
4. **Telefone**: Formatação brasileira opcional

### Tratamento de Erros
```typescript
// Tipos de erro
interface ValidationError {
  field: string
  message: string
}

interface ApiError {
  code: string
  message: string
  details?: any
}

// Estados de erro
- VALIDATION_ERROR: Dados inválidos
- DUPLICATE_ERROR: Cliente já existe
- NOT_FOUND_ERROR: Cliente não encontrado
- NETWORK_ERROR: Falha na conexão
- SERVER_ERROR: Erro interno
```

## Testing Strategy

### Testes de Validação
1. **CPF/CNPJ**: Testar documentos válidos e inválidos
2. **CEP**: Testar busca automática e fallback manual
3. **Email**: Testar formatos válidos e inválidos
4. **Formulário**: Testar submissão e cancelamento

### Testes de CRUD
1. **Create**: Criar cliente com dados válidos
2. **Read**: Listar e visualizar clientes
3. **Update**: Editar dados existentes
4. **Delete**: Excluir com e sem dependências

### Testes de UX
1. **Loading States**: Indicadores durante operações
2. **Empty States**: Quando não há clientes
3. **Error States**: Mensagens de erro claras
4. **Success States**: Confirmações de ações

## Performance Considerations

### Otimizações
1. **Paginação**: Carregar apenas 20 clientes por vez
2. **Debounce**: Busca com delay de 300ms
3. **Lazy Loading**: Carregar detalhes sob demanda
4. **Caching**: Cache de resultados de busca

### Métricas
- Tempo de carregamento da lista: < 500ms
- Tempo de busca: < 200ms
- Tempo de validação: < 100ms
- Tempo de salvamento: < 1s

## Accessibility

### Padrões WCAG
1. **Keyboard Navigation**: Tab order lógico
2. **Screen Readers**: Labels e descriptions
3. **Color Contrast**: Mínimo 4.5:1
4. **Focus Indicators**: Visíveis e claros

### Implementação
- Usar semantic HTML
- ARIA labels apropriados
- Mensagens de erro associadas aos campos
- Indicadores de estado para screen readers