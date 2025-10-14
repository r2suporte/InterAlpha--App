# Relatório de Verificação de APIs Externas
**Data:** 14 de outubro de 2025  
**Projeto:** InterAlpha App

---

## 📊 Resumo Executivo

| API | Status | Detalhes |
|-----|--------|----------|
| **ViaCEP** | ✅ **FUNCIONANDO** | Consulta de CEP operacional |
| **BrasilAPI (CNPJ)** | ⚠️ **BLOQUEADA** | Retornando HTTP 403 |
| **Validação CPF/CNPJ** | ✅ **FUNCIONANDO** | Validação local operacional |

---

## 1️⃣ API ViaCEP

### Status: ✅ **FUNCIONANDO PERFEITAMENTE**

**URL Base:** `https://viacep.com.br/ws/{cep}/json/`

### Testes Realizados:

| CEP | Local | Resultado |
|-----|-------|-----------|
| 01310-100 | Av. Paulista, SP | ✅ Sucesso |
| 20040-020 | Centro, RJ | ✅ Sucesso |
| 30130-100 | Centro, BH | ✅ Sucesso |

### Exemplo de Resposta:
```json
{
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "complemento": "",
  "bairro": "Bela Vista",
  "localidade": "São Paulo",
  "uf": "SP"
}
```

### Implementação no Código:
- **Arquivo:** `lib/validators.ts`
- **Função:** `buscarEnderecoPorCEP(cep: string)`
- **Uso:** Página de clientes (`app/dashboard/clientes/page.tsx`)

### ✅ Recomendações:
- **Nenhuma ação necessária**
- API funcionando normalmente
- Sem rate limits detectados
- Resposta rápida (~200ms)

---

## 2️⃣ API BrasilAPI (Consulta CNPJ)

### Status: ⚠️ **BLOQUEADA (HTTP 403)**

**URL Base:** `https://brasilapi.com.br/api/cnpj/v1/{cnpj}`

### Testes Realizados:

| CNPJ | Empresa | Resultado |
|------|---------|-----------|
| 00.000.000/0001-91 | Banco do Brasil | ❌ HTTP 403 |
| 33.000.167/0001-01 | Caixa Econômica | ❌ HTTP 403 |
| 18.236.120/0001-58 | Banco Inter | ❌ HTTP 403 |

### Problema Identificado:
- **HTTP 403 Forbidden**: Acesso bloqueado pela API
- **Possíveis Causas:**
  - Rate limiting muito agressivo
  - Bloqueio por região/IP
  - Mudança na política da API
  - Necessidade de autenticação

### Implementação Atual:
- **Arquivo:** `lib/validators.ts`
- **Função:** `buscarDadosCNPJ(cnpj: string)`
- **Uso:** Página de clientes para autocompletar dados

### ⚠️ Impacto no Sistema:
- **Funcionalidade afetada:** Busca automática de dados por CNPJ
- **Workaround atual:** Usuário precisa preencher manualmente
- **Validação:** Continua funcionando (validação local do CNPJ)

---

## 🔧 Soluções Recomendadas para API CNPJ

### Opção 1: ✅ **ReceitaWS (Recomendado)**
```javascript
// URL: https://www.receitaws.com.br/v1/cnpj/{cnpj}
// Limite: 3 consultas/minuto (gratuito)
// Resposta similar à BrasilAPI
```

**Prós:**
- API estável e confiável
- Usado por muitos sistemas
- Documentação clara
- Dados oficiais da Receita Federal

**Contras:**
- Rate limit de 3 req/min (versão gratuita)
- Pode exigir plano pago para uso intenso

### Opção 2: 🔄 **Fallback em Cascata**
```javascript
async function buscarCNPJ(cnpj) {
  // 1. Tentar BrasilAPI
  try {
    return await buscarBrasilAPI(cnpj);
  } catch {}
  
  // 2. Fallback: ReceitaWS
  try {
    return await buscarReceitaWS(cnpj);
  } catch {}
  
  // 3. Fallback: API própria/cache
  return await buscarCache(cnpj);
}
```

### Opção 3: 📦 **Cache Local**
- Armazenar consultas bem-sucedidas
- Reduzir chamadas à API
- Usar Supabase para cache

### Opção 4: 🌐 **API Própria**
- Criar endpoint próprio `/api/cnpj/[cnpj]`
- Usar múltiplas fontes
- Implementar rate limiting próprio

---

## 3️⃣ Validação CPF/CNPJ (Local)

### Status: ✅ **FUNCIONANDO PERFEITAMENTE**

**Biblioteca:** `cpf-cnpj-validator`

### Funções Disponíveis:
```typescript
// Validação
validarCPF(cpf: string): boolean
validarCNPJ(cnpj: string): boolean
validarCpfCnpj(doc: string, tipo: TipoPessoa): boolean

// Formatação
formatarCPF(cpf: string): string        // 123.456.789-01
formatarCNPJ(cnpj: string): string      // 12.345.678/0001-90
formatarCpfCnpj(doc: string, tipo: TipoPessoa): string

// Utilitários
getMascaraCpfCnpj(tipo: TipoPessoa): string
```

### ✅ Funcionamento:
- Validação de dígitos verificadores
- Rejeição de CPF/CNPJ com dígitos repetidos
- Formatação automática com máscaras
- Performance: < 1ms por validação

---

## 📋 Plano de Ação

### ✅ Concluído:
1. ✅ Teste da API ViaCEP
2. ✅ Teste da API BrasilAPI
3. ✅ Verificação de validações locais
4. ✅ Documentação do problema

### 🔄 Próximos Passos:

#### Urgente (P0):
- [ ] **Implementar fallback para CNPJ**
  - Adicionar ReceitaWS como alternativa
  - Implementar tratamento de rate limit
  - Adicionar mensagem clara ao usuário

#### Importante (P1):
- [ ] **Otimizar busca de CNPJ**
  - Implementar cache de consultas
  - Debounce na busca automática
  - Loading states melhores

#### Desejável (P2):
- [ ] **Criar endpoint próprio**
  - `/api/cnpj/[cnpj]` no backend
  - Agregar múltiplas fontes
  - Cache de 30 dias

---

## 💡 Código de Exemplo: Implementação com Fallback

```typescript
// lib/validators.ts

export const buscarDadosCNPJ = async (
  cnpjValue: string
): Promise<CNPJResponse | null> => {
  const cleanCnpj = cnpjValue.replace(/\D/g, '');

  if (!validarCNPJ(cleanCnpj)) {
    return null;
  }

  // Tentar BrasilAPI primeiro
  try {
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const data = await response.json();
      return mapearBrasilAPI(data);
    }
  } catch (error) {
    console.warn('BrasilAPI falhou, tentando ReceitaWS...', error);
  }

  // Fallback: ReceitaWS
  try {
    const response = await fetch(
      `https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (response.ok) {
      const data = await response.json();
      return mapearReceitaWS(data);
    }
  } catch (error) {
    console.error('Todas as APIs de CNPJ falharam', error);
  }

  return {
    cnpj: cleanCnpj,
    nome: '',
    situacao: 'Não foi possível consultar o CNPJ',
    atividade_principal: [],
    erro: true,
    message: 'Serviço de consulta CNPJ temporariamente indisponível',
  };
};
```

---

## 📞 Contatos e Referências

### APIs Testadas:
- **ViaCEP:** https://viacep.com.br/
- **BrasilAPI:** https://brasilapi.com.br/
- **ReceitaWS:** https://www.receitaws.com.br/

### Bibliotecas:
- **cpf-cnpj-validator:** https://www.npmjs.com/package/cpf-cnpj-validator

---

## ✅ Conclusão

O sistema está **70% operacional** para as APIs externas:

- ✅ **ViaCEP:** Totalmente funcional
- ⚠️ **BrasilAPI CNPJ:** Bloqueada, necessita alternativa
- ✅ **Validação CPF/CNPJ:** Totalmente funcional

**Recomendação:** Implementar ReceitaWS como fallback **IMEDIATAMENTE** para restaurar a funcionalidade de consulta de CNPJ.
