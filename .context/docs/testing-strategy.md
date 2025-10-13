<!-- agent-update:start:testing-strategy -->

# Testing Strategy

Este documento define como a qualidade é mantida no **InterAlpha App** através de uma estratégia abrangente de testes.

## Filosofia de Testes

### Pirâmide de Testes
```
        /\
       /  \
      / E2E \     ← Poucos testes, alto valor
     /______\
    /        \
   /Integration\ ← Testes de integração
  /__________\
 /            \
/  Unit Tests  \   ← Muitos testes, rápidos
/______________\
```

### Princípios
- **Fast Feedback**: Testes unitários rápidos para feedback imediato
- **Confidence**: Testes de integração para fluxos críticos
- **User-Centric**: Testes E2E para jornadas do usuário
- **Maintainable**: Testes legíveis e fáceis de manter

## Test Types

### 1. Unit Tests (Jest + React Testing Library)

**Objetivo**: Testar componentes e funções isoladamente

**Ferramentas**:
- **Jest**: Framework de testes
- **React Testing Library**: Testes de componentes React
- **@testing-library/jest-dom**: Matchers customizados

**Convenções de Nomenclatura**:
```
src/
├── components/
│   ├── Button.tsx
│   └── __tests__/
│       └── Button.test.tsx
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts
```

**Exemplo de Teste de Componente**:
```typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

**Exemplo de Teste de Utilitário**:
```typescript
// lib/__tests__/utils.test.ts
import { formatCPF, validateEmail } from '../utils'

describe('formatCPF', () => {
  it('formats CPF correctly', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01')
  })

  it('handles invalid input', () => {
    expect(formatCPF('123')).toBe('123')
  })
})

describe('validateEmail', () => {
  it('validates correct email', () => {
    expect(validateEmail('user@example.com')).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false)
  })
})
```

### 2. Integration Tests

**Objetivo**: Testar interação entre módulos e APIs

**Cenários Cobertos**:
- **API Routes**: Endpoints com banco de dados
- **Database Operations**: Operações CRUD via Prisma
- **Authentication Flow**: Login/logout/autorização
- **External Services**: Integrações com Stripe, Twilio, etc.

**Exemplo de Teste de API**:
```typescript
// __tests__/api/clientes.test.ts
import { POST, GET } from '@/app/api/clientes/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

describe('/api/clientes', () => {
  beforeEach(async () => {
    await prisma.cliente.deleteMany()
  })

  describe('POST', () => {
    it('creates client with valid data', async () => {
      const request = new NextRequest('http://localhost/api/clientes', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'João Silva',
          email: 'joao@example.com',
          telefone: '11999999999'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.cliente.nome).toBe('João Silva')
    })

    it('returns error for invalid data', async () => {
      const request = new NextRequest('http://localhost/api/clientes', {
        method: 'POST',
        body: JSON.stringify({
          nome: '', // Invalid
          email: 'invalid-email'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })
})
```

### 3. End-to-End Tests (Cypress)

**Objetivo**: Testar jornadas completas do usuário

**Ferramentas**:
- **Cypress**: Framework E2E
- **cypress-real-events**: Eventos reais do usuário
- **@testing-library/cypress**: Queries familiares

**Cenários Críticos**:
- **Autenticação**: Login/logout/registro
- **Gestão de Clientes**: CRUD completo
- **Ordens de Serviço**: Criação e acompanhamento
- **Portal do Cliente**: Acesso e funcionalidades
- **Relatórios**: Geração e visualização

**Estrutura de Testes E2E**:
```
cypress/
├── e2e/
│   ├── auth/
│   │   ├── login.cy.ts
│   │   └── register.cy.ts
│   ├── dashboard/
│   │   ├── clientes.cy.ts
│   │   └── ordens-servico.cy.ts
│   └── portal/
│       └── cliente.cy.ts
├── fixtures/
│   ├── users.json
│   └── clientes.json
└── support/
    ├── commands.ts
    └── e2e.ts
```

**Exemplo de Teste E2E**:
```typescript
// cypress/e2e/auth/login.cy.ts
describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/login')
  })

  it('logs in with valid credentials', () => {
    cy.get('[data-testid=email-input]').type('admin@interalpha.com')
    cy.get('[data-testid=password-input]').type('password123')
    cy.get('[data-testid=login-button]').click()

    cy.url().should('include', '/dashboard')
    cy.get('[data-testid=user-menu]').should('be.visible')
  })

  it('shows error for invalid credentials', () => {
    cy.get('[data-testid=email-input]').type('invalid@email.com')
    cy.get('[data-testid=password-input]').type('wrongpassword')
    cy.get('[data-testid=login-button]').click()

    cy.get('[data-testid=error-message]')
      .should('be.visible')
      .and('contain', 'Credenciais inválidas')
  })
})
```

## Running Tests

### Comandos Principais

```bash
# Testes Unitários
npm run test                    # Executa todos os testes unitários
npm run test:watch             # Modo watch para desenvolvimento
npm run test:coverage          # Gera relatório de cobertura
npm run test:ci                # Execução otimizada para CI

# Testes de Integração
npm run test:integration       # Executa testes de integração
npm run test:api               # Testes específicos de API

# Testes E2E
npm run test:e2e               # Executa testes Cypress
npm run test:e2e:headed        # Executa com interface gráfica
npm run test:e2e:dev           # Executa contra servidor local

# Todos os Testes
npm run test:all               # Executa toda a suíte de testes
```

### Configurações de Ambiente

**Jest Configuration** (`jest.config.js`):
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
```

**Cypress Configuration** (`cypress.config.ts`):
```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true
  }
})
```

## Quality Gates

### Cobertura de Código
- **Mínimo Global**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Critérios de Qualidade

#### Para Pull Requests
- [ ] **Todos os testes passando** (unit + integration + e2e)
- [ ] **Cobertura ≥ 70%** para código novo
- [ ] **Zero vulnerabilidades críticas** (npm audit)
- [ ] **Lint sem erros** (ESLint + Prettier)
- [ ] **Type check passando** (TypeScript)
- [ ] **Build bem-sucedido** (Next.js build)

#### Para Releases
- [ ] **Cobertura global ≥ 70%**
- [ ] **Todos os testes E2E passando**
- [ ] **Performance tests** (se aplicável)
- [ ] **Security audit** limpo
- [ ] **Documentação atualizada**

### Métricas de Qualidade

**Acompanhamento Contínuo**:
- **Test Success Rate**: >95%
- **Build Success Rate**: >98%
- **Mean Time to Recovery**: <2 horas
- **Test Execution Time**: <10 minutos (total)

## Test Data Management

### Fixtures e Mocks

**Dados de Teste**:
```typescript
// __tests__/fixtures/clientes.ts
export const mockCliente = {
  id: '1',
  nome: 'João Silva',
  email: 'joao@example.com',
  telefone: '11999999999',
  cpf: '12345678901',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
}

export const mockClientes = [
  mockCliente,
  {
    id: '2',
    nome: 'Maria Santos',
    email: 'maria@example.com',
    telefone: '11888888888',
    cpf: '98765432109',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
]
```

**Database Seeding**:
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed data for testing
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@interalpha.com',
        name: 'Admin User',
        role: 'ADMIN'
      },
      {
        email: 'tecnico@interalpha.com',
        name: 'Técnico User',
        role: 'TECNICO'
      }
    ]
  })
}
```

## Troubleshooting

### Problemas Comuns

#### 1. Testes Flaky
**Sintomas**: Testes que passam/falham inconsistentemente
**Soluções**:
- Usar `waitFor` para elementos assíncronos
- Evitar timeouts fixos, usar condições
- Limpar estado entre testes

```typescript
// ❌ Problemático
test('loads data', () => {
  render(<DataComponent />)
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
})

// ✅ Correto
test('loads data', async () => {
  render(<DataComponent />)
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

#### 2. Testes Lentos
**Sintomas**: Suíte de testes demora muito para executar
**Soluções**:
- Usar `jest.mock()` para dependências pesadas
- Paralelizar execução com `--maxWorkers`
- Otimizar queries de banco de dados

#### 3. Problemas de Ambiente
**Sintomas**: Testes passam localmente mas falham no CI
**Soluções**:
- Verificar variáveis de ambiente
- Usar containers Docker para consistência
- Configurar timeouts adequados

### Debugging

**Jest Debug**:
```bash
# Debug específico
npm run test -- --testNamePattern="should create client" --verbose

# Debug com breakpoints
node --inspect-brk node_modules/.bin/jest --runInBand
```

**Cypress Debug**:
```bash
# Modo interativo
npm run test:e2e:headed

# Debug com logs
DEBUG=cypress:* npm run test:e2e
```

### Performance Monitoring

**Métricas de Teste**:
- **Execution Time**: Tempo total de execução
- **Flaky Rate**: Taxa de testes instáveis
- **Coverage Trend**: Tendência de cobertura
- **Test Count**: Número total de testes

**Alertas**:
- Execução > 10 minutos
- Cobertura < 70%
- Taxa de falha > 5%
- Testes flaky > 2%

<!-- agent-readonly:guidance -->

## AI Update Checklist

1. Review test scripts and CI workflows to confirm command accuracy.
2. Update Quality Gates with current thresholds (coverage %, lint rules, required checks).
3. Document new test categories or suites introduced since the last update.
4. Record known flaky areas and link to open issues for visibility.
5. Confirm troubleshooting steps remain valid with current tooling.

<!-- agent-readonly:sources -->

## Acceptable Sources

- `package.json` scripts and testing configuration files.
- CI job definitions (GitHub Actions, CircleCI, etc.).
- Issue tracker items labelled “testing” or “flaky” with maintainer confirmation.

<!-- agent-update:end -->
