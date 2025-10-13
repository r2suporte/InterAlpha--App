# Contributing to InterAlpha App

Obrigado por seu interesse em contribuir com o **InterAlpha App**! Este documento fornece diretrizes para contribuições efetivas.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Desenvolvimento](#padrões-de-desenvolvimento)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Melhorias](#sugerindo-melhorias)

## 🤝 Código de Conduta

Este projeto segue um código de conduta baseado em respeito mútuo, colaboração e inclusão. Esperamos que todos os contribuidores:

- Sejam respeitosos e construtivos nas discussões
- Aceitem feedback de forma positiva
- Foquem no que é melhor para a comunidade
- Demonstrem empatia com outros membros da comunidade

## 🚀 Como Contribuir

### Tipos de Contribuição

1. **🐛 Correção de Bugs** - Identifique e corrija problemas existentes
2. **✨ Novas Funcionalidades** - Implemente recursos solicitados
3. **📚 Documentação** - Melhore ou crie documentação
4. **🧪 Testes** - Adicione ou melhore a cobertura de testes
5. **🎨 UI/UX** - Melhore a interface e experiência do usuário
6. **⚡ Performance** - Otimize código e performance

### Primeiros Passos

1. **Fork** o repositório
2. **Clone** seu fork localmente
3. **Configure** o ambiente de desenvolvimento
4. **Escolha** uma issue para trabalhar
5. **Crie** uma branch para sua contribuição
6. **Implemente** suas mudanças
7. **Teste** suas alterações
8. **Submeta** um Pull Request

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- **Node.js** 18.0.0 ou superior
- **npm** 9.0.0 ou superior
- **Git** 2.30.0 ou superior
- **PostgreSQL** (via Supabase)

### Setup Inicial

```bash
# 1. Clone seu fork
git clone https://github.com/SEU-USERNAME/interalpha-app.git
cd interalpha-app

# 2. Adicione o repositório original como upstream
git remote add upstream https://github.com/ORIGINAL-OWNER/interalpha-app.git

# 3. Instale dependências
npm install

# 4. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 5. Configure o banco de dados
npx prisma db push
npx prisma db seed

# 6. Execute os testes para verificar setup
npm run test

# 7. Inicie o servidor de desenvolvimento
npm run dev
```

### Verificação do Setup

Execute estes comandos para verificar se tudo está funcionando:

```bash
npm run lint          # Deve passar sem erros
npm run type-check    # Deve passar sem erros
npm run test          # Todos os testes devem passar
npm run build         # Build deve ser bem-sucedido
```

## 📝 Padrões de Desenvolvimento

### Convenções de Código

#### TypeScript
- Use **TypeScript** para todo código novo
- Defina tipos explícitos quando necessário
- Evite `any` - use tipos específicos ou `unknown`

#### Naming Conventions
```typescript
// Componentes: PascalCase
const UserProfile = () => { ... }

// Funções e variáveis: camelCase
const getUserData = () => { ... }
const isAuthenticated = true

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'

// Arquivos: kebab-case
user-profile.tsx
api-client.ts
```

#### Estrutura de Componentes
```typescript
// components/ui/button.tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md',
          // variant styles...
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
```

### Padrões de API

#### Estrutura de Endpoints
```typescript
// app/api/clientes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createClientSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().min(10)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createClientSchema.parse(body)
    
    // Lógica de negócio...
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid data' },
      { status: 400 }
    )
  }
}
```

### Padrões de Teste

#### Testes de Componente
```typescript
// __tests__/components/button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('destructive')
  })
})
```

#### Testes de API
```typescript
// __tests__/api/clientes.test.ts
import { POST } from '@/app/api/clientes/route'
import { NextRequest } from 'next/server'

describe('/api/clientes', () => {
  it('creates client with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/clientes', {
      method: 'POST',
      body: JSON.stringify({
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '11999999999'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

## 🔄 Processo de Pull Request

### Antes de Submeter

1. **Sincronize** com a branch principal:
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

2. **Crie** uma branch descritiva:
```bash
git checkout -b feature/adicionar-relatorio-vendas
# ou
git checkout -b fix/corrigir-validacao-cpf
```

3. **Execute** todos os testes:
```bash
npm run test
npm run lint
npm run type-check
npm run build
```

### Commits

Use **Conventional Commits**:

```bash
# Funcionalidades
git commit -m "feat: adiciona relatório de vendas mensais"

# Correções
git commit -m "fix: corrige validação de CPF no cadastro"

# Documentação
git commit -m "docs: atualiza guia de instalação"

# Testes
git commit -m "test: adiciona testes para módulo de clientes"

# Refatoração
git commit -m "refactor: melhora estrutura do componente Dashboard"

# Performance
git commit -m "perf: otimiza consulta de ordens de serviço"
```

### Template de Pull Request

```markdown
## 📝 Descrição

Breve descrição das mudanças implementadas.

## 🔗 Issue Relacionada

Fixes #123

## 🧪 Tipo de Mudança

- [ ] 🐛 Bug fix (mudança que corrige um problema)
- [ ] ✨ Nova funcionalidade (mudança que adiciona funcionalidade)
- [ ] 💥 Breaking change (mudança que quebra compatibilidade)
- [ ] 📚 Documentação (mudança apenas na documentação)

## ✅ Checklist

- [ ] Meu código segue as diretrizes do projeto
- [ ] Realizei uma auto-revisão do meu código
- [ ] Comentei meu código em partes complexas
- [ ] Fiz mudanças correspondentes na documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes que provam que minha correção/funcionalidade funciona
- [ ] Testes novos e existentes passam localmente

## 📸 Screenshots (se aplicável)

Adicione screenshots para mudanças na UI.

## 🧪 Como Testar

1. Passos para testar as mudanças
2. Casos de teste específicos
3. Dados de teste necessários
```

## 🐛 Reportando Bugs

### Antes de Reportar

1. **Verifique** se o bug já foi reportado
2. **Teste** na versão mais recente
3. **Colete** informações do ambiente

### Template de Bug Report

```markdown
## 🐛 Descrição do Bug

Descrição clara e concisa do problema.

## 🔄 Passos para Reproduzir

1. Vá para '...'
2. Clique em '...'
3. Role para baixo até '...'
4. Veja o erro

## ✅ Comportamento Esperado

Descrição do que deveria acontecer.

## 📸 Screenshots

Se aplicável, adicione screenshots.

## 🖥️ Ambiente

- OS: [ex: macOS 13.0]
- Browser: [ex: Chrome 108]
- Node.js: [ex: 18.12.0]
- npm: [ex: 8.19.2]

## 📋 Informações Adicionais

Qualquer outra informação relevante.
```

## 💡 Sugerindo Melhorias

### Template de Feature Request

```markdown
## 🚀 Resumo da Funcionalidade

Descrição clara da funcionalidade desejada.

## 🎯 Motivação

Por que esta funcionalidade seria útil?

## 📝 Descrição Detalhada

Descrição detalhada de como a funcionalidade deveria funcionar.

## 🎨 Mockups/Wireframes

Se aplicável, adicione mockups ou wireframes.

## 🔧 Implementação Sugerida

Sugestões técnicas para implementação (opcional).

## 📋 Critérios de Aceitação

- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3
```

## 📚 Recursos Adicionais

- **Documentação**: [.context/docs/](.context/docs/)
- **Arquitetura**: [architecture.md](.context/docs/architecture.md)
- **Workflow**: [development-workflow.md](.context/docs/development-workflow.md)
- **Testes**: [testing-strategy.md](.context/docs/testing-strategy.md)
- **Segurança**: [security.md](.context/docs/security.md)

## 🤔 Dúvidas?

- Abra uma **Discussion** para perguntas gerais
- Crie uma **Issue** para bugs ou feature requests
- Consulte a **documentação** em `.context/docs/`

---

**Obrigado por contribuir com o InterAlpha App! 🚀**