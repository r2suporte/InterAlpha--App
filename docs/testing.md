# Testes

## Visão Geral

O InterAlpha utiliza uma abordagem abrangente de testes para garantir a qualidade e confiabilidade do código. A estratégia inclui testes unitários, testes de integração e testes end-to-end.

## Estrutura de Testes

### Localização
```
interalpha-app/
├── __tests__/              # Testes unitários e de integração
├── src/
│   ├── app/
│   │   └── **/*/__tests__/ # Testes específicos de componentes
│   └── ...
├── jest.config.js          # Configuração do Jest
├── jest.setup.js           # Setup dos testes
└── ...
```

### Ferramentas
- **Jest** - Framework de testes
- **React Testing Library** - Para testes de componentes React
- **@testing-library/jest-dom** - Matchers adicionais para DOM
- **@testing-library/user-event** - Simulação de interações do usuário

## Tipos de Testes

### 1. Testes Unitários
Testam unidades individuais de código (funções, métodos, componentes pequenos):

```typescript
// src/lib/utils/__tests__/format.test.ts
import { formatCurrency } from '../format';

describe('formatCurrency', () => {
  it('deve formatar valores corretamente', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00');
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });
});
```

### 2. Testes de Componentes
Testam componentes React em isolamento:

```typescript
// src/components/ui/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('deve renderizar corretamente', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('deve chamar onClick quando clicado', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 3. Testes de Integração
Testam a interação entre múltiplos módulos ou serviços:

```typescript
// src/services/__tests__/client-service.test.ts
import { clientService } from '../client-service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');

describe('ClientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar um cliente', async () => {
    (prisma.client.create as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'João Silva',
      email: 'joao@example.com'
    });

    const client = await clientService.createClient({
      name: 'João Silva',
      email: 'joao@example.com'
    });

    expect(client).toEqual({
      id: 1,
      name: 'João Silva',
      email: 'joao@example.com'
    });
    expect(prisma.client.create).toHaveBeenCalledWith({
      data: {
        name: 'João Silva',
        email: 'joao@example.com'
      }
    });
  });
});
```

### 4. Testes de API
Testam endpoints da API:

```typescript
// src/app/api/clients/__tests__/route.test.ts
import { GET } from '../route';
import { clientService } from '@/services/client-service';

jest.mock('@/services/client-service');

describe('API Clients', () => {
  it('deve retornar lista de clientes', async () => {
    (clientService.getClients as jest.Mock).mockResolvedValue([
      { id: 1, name: 'João Silva' }
    ]);

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual([{ id: 1, name: 'João Silva' }]);
    expect(response.status).toBe(200);
  });
});
```

## Configuração

### Jest Config
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/'
  ]
};
```

### Setup
```javascript
// jest.setup.js
import '@testing-library/jest-dom';
```

## Comandos de Teste

### Scripts npm
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### Execução
- `npm test` - Executar todos os testes
- `npm run test:watch` - Executar testes em modo watch
- `npm run test:coverage` - Executar testes com relatório de cobertura

## Mocks e Stubs

### Mocking de Módulos
```typescript
// Mock de dependências externas
jest.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
      create: jest.fn()
    }
  }
}));
```

### Mocking de Funções
```typescript
// Mock de funções utilitárias
const mockFormatDate = jest.fn();
jest.mock('@/lib/utils/date', () => ({
  formatDate: mockFormatDate
}));
```

## Cobertura de Testes

### Metas
- Cobertura mínima de 80% para services críticos
- Cobertura mínima de 70% para componentes principais
- 100% de cobertura para funções utilitárias puras

### Relatórios
Os relatórios de cobertura são gerados em `coverage/` ao executar `npm run test:coverage`.

## Testes de Componentes Complexos

### Providers
Para componentes que utilizam context providers:

```typescript
// src/test-utils.tsx
import { render } from '@testing-library/react';
import { UserProvider } from '@/contexts/UserContext';

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    {children}
  </UserProvider>
);

const customRender = (ui: React.ReactElement, options?: object) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Hooks Customizados
```typescript
// src/hooks/__tests__/useClient.test.ts
import { renderHook, act } from '@testing-library/react';
import { useClient } from '../useClient';

describe('useClient', () => {
  it('deve carregar cliente', async () => {
    const { result } = renderHook(() => useClient('1'));
    
    expect(result.current.loading).toBe(true);
    
    // Aguardar resolução
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.client).toBeDefined();
  });
});
```

## Testes de Integração com Banco de Dados

### Testes com Prisma
Para testes que requerem interação real com o banco:

```typescript
// jest.config.integration.js
module.exports = {
  ...require('./jest.config'),
  testMatch: ['**/__tests__/*.integration.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.js']
};
```

```typescript
// jest.setup.integration.js
import { prisma } from '@/lib/prisma';

beforeEach(async () => {
  // Limpar dados de teste
  await prisma.client.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## Testes E2E

### Playwright/Cypress
Para testes end-to-end, recomenda-se utilizar Playwright ou Cypress:

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('deve fazer login com sucesso', async ({ page }) => {
  await page.goto('/sign-in');
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

## Boas Práticas

### 1. Estrutura de Testes
- Nomear arquivos de teste com `.test.ts` ou `.test.tsx`
- Colocar testes próximos ao código que testam
- Organizar testes por funcionalidade

### 2. Escrevendo Testes
- Utilizar nomes descritivos para testes (`it`/`test`)
- Testar um comportamento por teste
- Utilizar Arrange-Act-Assert
- Limpar estado entre testes

### 3. Mocks
- Mockar dependências externas
- Não mockar código que está sendo testado
- Verificar chamadas de mocks quando relevante

### 4. Cobertura
- Priorizar testes de caminhos críticos
- Testar casos de erro e borda
- Manter cobertura acima de 80% para código novo

### 5. Manutenção
- Atualizar testes quando a funcionalidade mudar
- Remover testes duplicados
- Refatorar testes juntamente com o código