# 📊 TASK 1B: TEST COVERAGE EXPANSION - PLANO ESTRATÉGICO

**Data:** 16 de outubro de 2025  
**Status:** 🔄 EM PROGRESSO  
**Objetivo:** Expandir coverage de 32.46% para 90%+  
**Duração Estimada:** 3-5 dias

---

## 🎯 SITUAÇÃO ATUAL

### Coverage por Categoria
```
All files:          32.46% (Target: 70%+) ❌
├─ lib:            91.3%  ✅
├─ lib/auth:       38.43% 🔴 PRIORIDADE 1
├─ lib/database:   0%     🔴 PRIORIDADE 3
├─ lib/middleware: 0%     🔴 PRIORIDADE 1
├─ lib/services:   31.05% 🔴 PRIORIDADE 2
├─ lib/supabase:   4.16%  🔴 PRIORIDADE 3
└─ lib/utils:      77.14% 🟡 PRIORIDADE 2
```

### Linhas Sem Cobertura (Critical)
```
lib/auth/
├─ client-middleware.ts ........ 66 linhas (0%)
├─ jwt.ts ....................... 128 linhas (0%)
└─ role-middleware.ts ........... 519 linhas (5.76% apenas)

lib/middleware/
├─ cache-middleware.ts .......... 215 linhas (0%)
├─ logging-middleware.ts ........ 428 linhas (0%)
├─ metrics-middleware.ts ........ 303 linhas (0%)
├─ rate-limit.ts ................ 288 linhas (0%)
└─ security-audit.ts ............ 380 linhas (0%)

lib/services/
├─ application-metrics.ts ....... 453 linhas (0%)
├─ cache-service.ts ............. 309 linhas (0%)
├─ logger-service.ts ............ 501 linhas (0%)
├─ pdf-generator.ts ............. 413 linhas (0%)
└─ websocket-service.ts ......... 189 linhas (14.6% apenas)

TOTAL: ~4,600 linhas críticas sem testes
```

---

## 📋 ESTRATÉGIA DE COBERTURA (Faseado)

### FASE 1: AUTH & MIDDLEWARE (Priority 1) - 2-3 DIAS
**Objetivo:** 0% → 80% (aumentar 1,214 linhas)

#### lib/auth/
1. **client-middleware.ts** (66 linhas)
   - [ ] Test auth token validation
   - [ ] Test token refresh logic
   - [ ] Test error handling
   - **Estimate:** 2 hours

2. **jwt.ts** (128 linhas)
   - [ ] Test JWT creation/verification
   - [ ] Test expiration handling
   - [ ] Test invalid token scenarios
   - **Estimate:** 3 hours

3. **role-middleware.ts** (519 linhas) - BIGGEST
   - [ ] Test role-based access control
   - [ ] Test permission checks
   - [ ] Test middleware chain
   - [ ] Test error cases
   - **Estimate:** 5 hours

#### lib/middleware/
4. **cache-middleware.ts** (215 linhas)
   - [ ] Test cache hit/miss scenarios
   - [ ] Test cache invalidation
   - [ ] Test TTL management
   - **Estimate:** 2 hours

5. **logging-middleware.ts** (428 linhas)
   - [ ] Test log formatting
   - [ ] Test different log levels
   - [ ] Test error logging
   - [ ] Test metrics capture
   - **Estimate:** 4 hours

6. **rate-limit.ts** (288 linhas)
   - [ ] Test rate limiting logic
   - [ ] Test limit exceeded scenarios
   - [ ] Test reset mechanisms
   - **Estimate:** 3 hours

7. **security-audit.ts** (380 linhas)
   - [ ] Test security audit checks
   - [ ] Test vulnerability detection
   - [ ] Test logging
   - **Estimate:** 3 hours

**Subtotal FASE 1:** 22 hours (2-3 days)

---

### FASE 2: SERVICES - PARTE 1 (Priority 2) - 2-3 DIAS
**Objetivo:** 31% → 70% (aumentar ~1,500 linhas)

#### lib/services/ (Priority Services)
1. **email-service.ts** (existing: 92.72%)
   - [ ] Add missing 7.28%: Error edge cases
   - **Estimate:** 1 hour

2. **sms-service.ts** (existing: 92.5%)
   - [ ] Add missing 7.5%: Error edge cases
   - **Estimate:** 1 hour

3. **whatsapp-service.ts** (existing: 97.14%)
   - [ ] Add missing 2.86%: Error cases
   - **Estimate:** 1 hour

4. **websocket-service.ts** (14.6% - LOW)
   - [ ] Test connection establishment
   - [ ] Test message broadcasting
   - [ ] Test disconnection handling
   - **Estimate:** 3 hours

5. **metrics-service.ts** (17.74% - LOW)
   - [ ] Test metric collection
   - [ ] Test aggregation
   - [ ] Test reporting
   - **Estimate:** 4 hours

6. **cache-service.ts** (0% - NONE)
   - [ ] Test cache operations
   - [ ] Test key management
   - [ ] Test TTL/expiration
   - **Estimate:** 3 hours

**Subtotal FASE 2:** 13 hours (2 days)

---

### FASE 3: SERVICES - PARTE 2 & UTILS (Priority 3) - 1-2 DIAS
**Objetivo:** Fill remaining gaps

#### lib/services/
1. **logger-service.ts** (0%)
   - [ ] Test logging functions
   - [ ] Test log levels
   - [ ] Test formatting
   - **Estimate:** 3 hours

2. **application-metrics.ts** (0%)
   - [ ] Test metric initialization
   - [ ] Test tracking
   - [ ] Test retrieval
   - **Estimate:** 3 hours

3. **pdf-generator.ts** (0%)
   - [ ] Test PDF generation
   - [ ] Test templates
   - [ ] Test error handling
   - **Estimate:** 3 hours

4. **alert-service.ts** (19.12%)
   - [ ] Test alert creation/triggering
   - [ ] Test rule evaluation
   - [ ] Test notifications
   - **Estimate:** 4 hours

#### lib/database/
5. **query-optimizer.ts** (0%)
   - [ ] Test query optimization logic
   - [ ] Test index recommendations
   - [ ] Test performance analysis
   - **Estimate:** 3 hours

#### lib/supabase/
6. **client.ts** + **server.ts** (4.16%)
   - [ ] Test client initialization
   - [ ] Test server helpers
   - [ ] Test authentication
   - **Estimate:** 2 hours

**Subtotal FASE 3:** 18 hours (2 days)

---

## 📊 RESUMO DO PLANO

| Fase | Arquivos | LOC | Esforço | Duração |
|------|----------|-----|---------|---------|
| FASE 1 | 7 | 1,924 | 22h | 2-3 dias |
| FASE 2 | 6 | 1,500 | 13h | 2 dias |
| FASE 3 | 7 | 1,200 | 18h | 2 dias |
| **TOTAL** | **20** | **4,624** | **53h** | **6-7 dias** |

**Objetivo Final:** 32.46% → 90%+

---

## 🚀 PRÓXIMO PASSO

Começaremos com **FASE 1: AUTH & MIDDLEWARE** pois são críticos para a segurança da aplicação.

**Arquivos a criar (ordem de prioridade):**
1. `__tests__/lib/auth/jwt.test.ts` - Testes de JWT
2. `__tests__/lib/auth/client-middleware.test.ts` - Testes middleware de client
3. `__tests__/lib/auth/role-middleware.test.ts` - Testes RBAC (maior arquivo)
4. `__tests__/lib/middleware/cache-middleware.test.ts`
5. `__tests__/lib/middleware/logging-middleware.test.ts`
6. `__tests__/lib/middleware/rate-limit.test.ts`
7. `__tests__/lib/middleware/security-audit.test.ts`

---

## 📝 NOTAS

- Testes devem usar Jest + Supertest para APIs
- Mock external services (Supabase, Twilio, Stripe, etc)
- Foco em edge cases e error handling
- Coverage goal: 90%+ statements, 85%+ branches
- Todos testes devem passar antes de commit

---

**Status:** Pronto para FASE 1 ✅
