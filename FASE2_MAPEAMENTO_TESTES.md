# Mapeamento de Testes Falhando - Fase 2

## Visão Geral

Após a execução completa dos testes, identificamos que dos 14 test suites totais:
- ✅ 4 estão passando
- ❌ 10 estão falhando

Vamos categorizar os testes falhando para facilitar a correção.

## Testes Passando (4/14)

1. ✅ `src/lib/__tests__/cache.test.ts`
2. ✅ `src/services/__tests__/ordem-servico-service.test.ts`
3. ✅ `src/components/ui/__tests__/badge.test.tsx`
4. ✅ `src/services/notifications/__tests__/product-notifications.test.ts`

## Testes Falhando (10/14)

### Categoria 1: Testes de Serviços (3/10)
1. ❌ `src/lib/services/__tests__/product-service.test.ts`
2. ❌ `src/app/api/produtos/__tests__/route.test.ts`
3. ❌ `src/app/api/produtos/__tests__/produtos.test.ts`

### Categoria 2: Testes de Componentes (4/10)
1. ❌ `src/components/produtos/__tests__/ImageUpload.test.tsx`
2. ❌ `src/components/forms/__tests__/ClientForm.test.tsx`
3. ❌ `src/app/(dashboard)/produtos/__tests__/page.test.tsx`
4. ❌ `src/components/produtos/__tests__/PriceCalculator.test.tsx`

### Categoria 3: Testes de Actions (1/10)
1. ❌ `src/app/actions/__tests__/produtos.test.ts`

### Categoria 4: Testes de API Routes (1/10)
1. ❌ `src/app/api/produtos/[id]/__tests__/route.test.ts`

### Categoria 5: Testes de Serviços Especializados (1/10)
1. ❌ `src/lib/services/__tests__/image-service.test.ts`

### Categoria 6: Testes E2E (1/10)
1. ❌ `tests/e2e/products.spec.ts`

## Análise Detalhada por Categoria

### Categoria 1: Testes de Serviços (3)

#### Erros Comuns:
- Problemas com mocks do Prisma
- Erros de importação de módulos
- Funções esperadas mas não implementadas

#### Prioridade: Alta
Esses testes cobrem a lógica de negócio principal do sistema e são críticos para a funcionalidade.

### Categoria 2: Testes de Componentes (4)

#### Erros Comuns:
- Problemas com hooks do React (`Invalid hook call`)
- Erros de renderização
- Problemas com contexto e providers
- Falhas nos seletores de teste

#### Prioridade: Média-Alta
Componentes são a interface do usuário e devem ser testados para garantir experiência consistente.

### Categoria 3: Testes de Actions (1)

#### Erros Comuns:
- Erros de sintaxe (`missing ) after argument list`)
- Problemas com imports do Clerk

#### Prioridade: Média
Actions são importantes para a interação do usuário com o backend.

### Categoria 4: Testes de API Routes (1)

#### Erros Comuns:
- Erros de sintaxe (`missing ) after argument list`)
- Problemas com imports do Clerk

#### Prioridade: Alta
API Routes são pontos de entrada críticos para integrações e funcionalidades.

### Categoria 5: Testes de Serviços Especializados (1)

#### Erros Comuns:
- Erros de sintaxe (`await isn't allowed in non-async function`)
- Problemas com mocks de módulos do sistema

#### Prioridade: Média
Serviços especializados são importantes mas não críticos imediatamente.

### Categoria 6: Testes E2E (1)

#### Erros Comuns:
- Testes sendo executados pelo Jest em vez do Playwright
- Configuração incorreta

#### Prioridade: Baixa-Média
Testes E2E são importantes mas podem ser corrigidos após os testes unitários.

## Plano de Correção Priorizado

### Fase 2.1: Correção de Testes de Serviços (2-3 dias)
1. Corrigir `src/lib/services/__tests__/product-service.test.ts`
2. Corrigir `src/app/api/produtos/__tests__/route.test.ts`
3. Corrigir `src/app/api/produtos/__tests__/produtos.test.ts`

### Fase 2.2: Correção de Testes de Componentes (2-3 dias)
1. Corrigir `src/components/produtos/__tests__/ImageUpload.test.tsx`
2. Corrigir `src/components/forms/__tests__/ClientForm.test.tsx`
3. Corrigir `src/app/(dashboard)/produtos/__tests__/page.test.tsx`
4. Corrigir `src/components/produtos/__tests__/PriceCalculator.test.tsx`

### Fase 2.3: Correção de Testes de Actions e API Routes (1-2 dias)
1. Corrigir `src/app/actions/__tests__/produtos.test.ts`
2. Corrigir `src/app/api/produtos/[id]/__tests__/route.test.ts`

### Fase 2.4: Correção de Testes de Serviços Especializados (1 dia)
1. Corrigir `src/lib/services/__tests__/image-service.test.ts`

### Fase 2.5: Correção de Testes E2E (1 dia)
1. Corrigir `tests/e2e/products.spec.ts`

## Recursos Necessários

1. **Agentes Especializados**:
   - Desenvolvedor Backend para testes de serviços e API
   - Desenvolvedor Frontend para testes de componentes
   - Engenheiro de Qualidade para padronização e coordenação

2. **Ferramentas**:
   - Jest configurado corretamente
   - React Testing Library
   - Mocks padronizados para Prisma, Clerk e outros serviços

3. **Documentação**:
   - Padrões de teste a serem seguidos
   - Guia de mocks e stubs
   - Estratégia de testes por camada

## Critérios de Sucesso

1. Todos os 10 testes falhando devem passar
2. Nenhum dos 4 testes passando deve quebrar
3. Tempo de execução dos testes deve permanecer aceitável (< 30 segundos)
4. Cobertura de testes deve aumentar significativamente
5. Código de teste deve ser legível e manutenível