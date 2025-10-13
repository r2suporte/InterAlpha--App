# Guia de Desenvolvimento - InterAlpha App

## Índice

1. [Configuração do Ambiente](#configuração-do-ambiente)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Ferramentas de Desenvolvimento](#ferramentas-de-desenvolvimento)
4. [Padrões de Código](#padrões-de-código)
5. [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
6. [Testes](#testes)
7. [Deploy e CI/CD](#deploy-e-cicd)
8. [Troubleshooting](#troubleshooting)

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Git
- PostgreSQL (ou acesso ao Supabase)

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd interalpha-app

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute o setup inicial
npm run dev:setup

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Authentication
JWT_SECRET=your-secret-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# External Services
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
STRIPE_SECRET_KEY=...
WHATSAPP_API_TOKEN=...

# Development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Estrutura do Projeto

```
interalpha-app/
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── admin/            # Admin-specific components
│   └── dashboard/        # Dashboard components
├── lib/                  # Utility libraries
│   ├── auth/             # Authentication logic
│   ├── database/         # Database utilities
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   └── utils/            # General utilities
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── __tests__/            # Test files
├── scripts/              # Development scripts
└── docs/                 # Documentation
```

## Ferramentas de Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Servidor de desenvolvimento
npm run dev:turbo          # Desenvolvimento com Turbopack
npm run dev:health         # Verificar saúde do projeto
npm run dev:setup          # Setup inicial do projeto
npm run dev:clean          # Limpar cache e dependências
npm run dev:info           # Informações do projeto

# Qualidade de Código
npm run lint:check         # Verificar lint
npm run lint:fix           # Corrigir problemas de lint
npm run format:check       # Verificar formatação
npm run format:write       # Formatar código
npm run type:check         # Verificar tipos TypeScript
npm run code:check         # Verificação completa de código
npm run code:fix           # Correção automática

# Testes
npm run test               # Testes unitários
npm run test:watch         # Testes em modo watch
npm run test:coverage      # Testes com cobertura
npm run test:ci            # Testes para CI
npm run test:e2e           # Testes end-to-end
npm run cypress:open       # Abrir Cypress

# Build e Deploy
npm run build              # Build de produção
npm run build:analyze      # Análise do bundle
npm run start              # Servidor de produção

# Manutenção
npm run deps:update        # Atualizar dependências
npm run deps:check         # Verificar dependências desatualizadas
npm run security:check     # Auditoria de segurança
npm run full:check         # Verificação completa
```

### Configuração do Editor

#### VS Code (Recomendado)

Extensões essenciais:

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer

#### Configuração (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Padrões de Código

### Estrutura de Componentes

```typescript
// components/example/ExampleComponent.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ExampleComponentProps {
  title: string
  onAction?: () => void
}

export function ExampleComponent({
  title,
  onAction
}: ExampleComponentProps) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Effect logic
  }, [])

  const handleAction = async () => {
    setIsLoading(true)
    try {
      await onAction?.()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <h2>{title}</h2>
      <Button
        onClick={handleAction}
        disabled={isLoading}
      >
        {isLoading ? 'Carregando...' : 'Ação'}
      </Button>
    </Card>
  )
}
```

### API Routes

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server"

import { z } from "zod"

import { verifyJWT } from "@/lib/auth/jwt"
import { logSecurityEvent } from "@/lib/middleware/security-audit"

const requestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      await logSecurityEvent({
        type: "unauthorized_access",
        ip: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        endpoint: "/api/example",
        details: { reason: "No token provided" }
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Validar dados
    const body = await request.json()
    const result = requestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.errors },
        { status: 400 }
      )
    }

    // Lógica de negócio
    const data = result.data
    // ... processar dados

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

### Hooks Customizados

```typescript
// hooks/use-example.ts
import { useEffect, useState } from "react"

import { useAuth } from "@/lib/auth/client-auth"

interface UseExampleOptions {
  autoFetch?: boolean
  onError?: (error: Error) => void
}

export function useExample(options: UseExampleOptions = {}) {
  const { autoFetch = true, onError } = options
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/example", {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [user, autoFetch])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}
```

## Fluxo de Desenvolvimento

### Git Workflow

1. **Criar Branch**

   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

2. **Desenvolvimento**
   - Fazer commits pequenos e frequentes
   - Seguir convenções de commit
   - Executar testes localmente

3. **Pre-commit Hooks**
   - Formatação automática
   - Lint check
   - Type check
   - Testes unitários

4. **Pull Request**
   - Descrição clara das mudanças
   - Screenshots para mudanças visuais
   - Testes passando
   - Review de código

5. **Merge**
   - Squash commits se necessário
   - Merge para main/master
   - Deploy automático

### Convenções de Commit

```bash
# Tipos de commit
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção

# Exemplos
feat(auth): adicionar autenticação JWT
fix(dashboard): corrigir carregamento de dados
docs(api): atualizar documentação da API
style(components): formatar código dos componentes
refactor(utils): simplificar função de validação
test(auth): adicionar testes de autenticação
chore(deps): atualizar dependências
```

## Testes

### Estrutura de Testes

```
__tests__/
├── api/                   # Testes de API
├── components/            # Testes de componentes
├── lib/                   # Testes de utilitários
├── integration/           # Testes de integração
└── e2e/                   # Testes end-to-end (Cypress)
```

### Testes Unitários (Jest)

```typescript
// __tests__/components/ExampleComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExampleComponent } from '@/components/example/ExampleComponent'

describe('ExampleComponent', () => {
  it('should render title correctly', () => {
    render(<ExampleComponent title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should call onAction when button is clicked', async () => {
    const mockAction = jest.fn()
    render(<ExampleComponent title="Test" onAction={mockAction} />)

    fireEvent.click(screen.getByText('Ação'))

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledTimes(1)
    })
  })
})
```

### Testes de API

```typescript
// __tests__/api/example.test.ts
import { createMocks } from "node-mocks-http"

import { POST } from "@/app/api/example/route"

describe("/api/example", () => {
  it("should return 401 without token", async () => {
    const { req } = createMocks({
      method: "POST",
      body: { name: "Test", email: "test@example.com" }
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe("Unauthorized")
  })
})
```

### Testes E2E (Cypress)

```typescript
// cypress/e2e/auth.cy.ts
describe("Authentication", () => {
  it("should login successfully", () => {
    cy.visit("/auth/login")
    cy.get("[data-testid=email]").type("user@example.com")
    cy.get("[data-testid=password]").type("password123")
    cy.get("[data-testid=submit]").click()

    cy.url().should("include", "/dashboard")
    cy.get("[data-testid=user-menu]").should("be.visible")
  })
})
```

## Deploy e CI/CD

### Ambientes

- **Development**: `localhost:3000`
- **Staging**: `staging.interalpha.com`
- **Production**: `app.interalpha.com`

### Pipeline CI/CD

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run code:check
      - run: npm run test:ci
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          # Deploy commands
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Build

```bash
# Limpar cache e reinstalar
npm run dev:clean
npm install
npm run build
```

#### 2. Problemas de Tipo TypeScript

```bash
# Verificar tipos
npm run type:check

# Regenerar tipos do Prisma
npx prisma generate
```

#### 3. Testes Falhando

```bash
# Executar testes específicos
npm test -- --testNamePattern="nome do teste"

# Debug de testes
npm run test:debug
```

#### 4. Problemas de Lint

```bash
# Corrigir automaticamente
npm run lint:fix
npm run format:write
```

### Logs e Debug

```typescript
// Para produção, usar sistema de logs
import { logger } from "@/lib/utils/logger"

// Usar console.log com contexto
console.log("[ComponentName]:", data)

logger.info("User action", { userId, action })
```

### Performance

```bash
# Analisar bundle
npm run build:analyze

# Verificar performance
npm run dev
# Abrir DevTools > Lighthouse
```

## Recursos Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [Cypress Documentation](https://docs.cypress.io)

---

**Última atualização**: $(date) **Versão**: 1.0 **Responsável**: Equipe de Desenvolvimento
InterAlpha
