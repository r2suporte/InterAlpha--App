# Por que NÃO podemos chamar Supabase diretamente nos testes?

## 📋 Problema Técnico

### 1️⃣ **AlertService chama Supabase no Constructor**

```typescript
export class AlertService {
  private supabase = createClient();  // ❌ Chamada síncrona no constructor
  private metricsService = new ApplicationMetricsService();
  
  // ... resto do código
}
```

### 2️⃣ **O que acontece quando você testa:**

```typescript
// ❌ ISTO TRAVA O TESTE
import { alertService } from '@/lib/services/alert-service';

describe('alert-service', () => {
  it('test', async () => {
    const result = await alertService.getRules();  // Tenta conectar ao Supabase REAL
  });
});
```

**Timeline do que acontece:**

1. `import { alertService }` carrega o módulo
2. Código no escopo do módulo executa
3. `AlertService` class é instanciada
4. `createClient()` é chamado → **TENTA CONECTAR AO SUPABASE REAL**
5. Sem credentials válidas → **TRAVA OU FALHA**

---

## ❓ Por que não simplesmente usar o Supabase de teste?

### Razão 1: Isolamento de Testes ⚙️
- Testes não devem depender de serviços externos
- Supabase está DOWN? Todos os testes falham
- Testes ficam **LENTOS** (esperar resposta do servidor)
- Não determinísticos (dados podem mudar)

### Razão 2: Credenciais Confidenciais 🔐
- Você não quer credenciais do BD real no CI/CD
- Testes precisam rodar sem secrets
- Diferentes ambientes (dev, test, prod)

### Razão 3: Velocidade ⚡
```
Com Supabase real:   ~500ms por query
Com Mocks Jest:      ~1ms per test
```

### Razão 4: Reprodutibilidade 🎯
```typescript
// Com Supabase REAL:
getRules() → às vezes 100 registros, às vezes 50 → testes instáveis

// Com Mocks:
getRules() → SEMPRE retorna [] (ou dados que você definiu) → previsível
```

---

## ✅ A Solução: MOCKS antes do IMPORT

### Padrão Correto:

```typescript
/**
 * @jest-environment node
 */

// ✅ PASSO 1: Mock ANTES de qualquer import
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  })),
}));

// ✅ PASSO 2: Agora importa o service (vai usar o mock, não o real)
import { alertService } from '@/lib/services/alert-service';

describe('alert-service', () => {
  it('can get rules', async () => {
    // ✅ Usa mock, não Supabase real
    const rules = await alertService.getRules();
    expect(Array.isArray(rules)).toBe(true);
  });
});
```

### Por que funciona?

1. `jest.mock()` **substitui o módulo** `@/lib/supabase/client`
2. Quando `AlertService` faz `createClient()` → **recebe o mock**
3. Mock NÃO faz conexão real
4. Teste rápido, previsível, isolado ✅

---

## 📊 Comparação: Real vs Mock

| Aspecto | Supabase Real | Mock Jest |
|---------|--------------|-----------|
| **Velocidade** | 500ms | 1ms |
| **Confiabilidade** | Depende do servidor | Controlada |
| **Isolamento** | ❌ Afeta BD real | ✅ Isolado |
| **Secrets necessários** | ✅ Sim | ❌ Não |
| **Determinístico** | ❌ Dados podem mudar | ✅ Sempre igual |
| **Bom para testes** | ❌ Não | ✅ Sim |

---

## 🎯 Estratégia de Testes Corretos

### ✅ Testes Unitários (com Mocks)
```typescript
// Testa LÓGICA da aplicação
- Mock Supabase ← VOCÊ CONTROLA os dados
- Testa funcionalidades isoladas
- Rápido (<5ms por teste)
```

### ✅ Testes de Integração (com Supabase REAL ou Docker)
```typescript
// Testa INTERAÇÃO com banco real
- Pode usar Supabase real ou container Docker
- Testa fluxos completos
- Mais lento mas necessário
```

### ✅ Testes E2E (com aplicação rodando)
```typescript
// Testa do ponto de vista do usuário
- Cypress/Playwright
- Browser + API + Database
```

---

## 🔍 Exemplo Prático: Por que AlertService travava

### ❌ Sem mock (TRAVA):
```typescript
// Este código faria com que o teste travasse:
const result = await alertService.getRules(); 
// ↓ Tenta conectar ao Supabase
// ↓ Sem credenciais válidas → ERRO ou TIMEOUT
```

### ✅ Com mock (FUNCIONA):
```typescript
// Com jest.mock() acima:
const result = await alertService.getRules();
// ↓ Chama mock que retorna { data: [], error: null } 
// ↓ Instantaneamente ✅
```

---

## 📝 Conclusão

**NÃO use Supabase real em testes porque:**

1. ❌ **Não isolado** - Afeta outras pessoas/ambientes
2. ❌ **Lento** - 500ms vs 1ms
3. ❌ **Instável** - Supabase down = todos os testes falham
4. ❌ **Inseguro** - Credentials expostas em CI/CD
5. ❌ **Não determinístico** - Dados mudam

**USE MOCKS porque:**

1. ✅ **Isolado** - Testes independentes
2. ✅ **Rápido** - Milissegundos
3. ✅ **Confiável** - Você controla os dados
4. ✅ **Seguro** - Sem credentials
5. ✅ **Determinístico** - Sempre mesmos resultados

---

## 🚀 Próximos Passos

1. Criar `alert-service.test.ts` **COM MOCKS** nas linhas 1-20
2. Testes focam em **TIPOS** e **LÓGICA**, não em conectividade BD
3. Se precisar testar com BD real → criar testes de **INTEGRAÇÃO** separados
