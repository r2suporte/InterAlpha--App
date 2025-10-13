<!-- agent-update:start:architecture-notes -->

# Architecture Notes

## System Architecture Overview

O **InterAlpha App** segue uma arquitetura **monolítica modular** baseada em Next.js 15 com App Router, oferecendo uma solução full-stack integrada para gestão de assistência técnica Apple.

### Topologia do Sistema

**Arquitetura**: Monolito modular com separação clara de responsabilidades
**Deployment**: Single-page application com SSR/SSG via Next.js
**Database**: PostgreSQL via Supabase com Prisma ORM
**Authentication**: Supabase Auth com controle de acesso baseado em roles

### Fluxo de Requisições

1. **Frontend (React)** → Interface do usuário com componentes reutilizáveis
2. **App Router (Next.js)** → Roteamento e middleware de autenticação
3. **API Routes** → Endpoints RESTful para operações de negócio
4. **Business Logic** → Serviços e validações específicas do domínio
5. **Data Layer** → Prisma ORM + Supabase PostgreSQL
6. **External APIs** → Integrações (Stripe, Twilio, WhatsApp, Google)

### Pontos de Controle

- **Middleware**: Autenticação e autorização em `middleware.ts`
- **API Layer**: Validação de entrada e controle de acesso
- **Service Layer**: Lógica de negócio e regras de domínio
- **Data Layer**: Validação de esquema e integridade referencial

## Core System Components

### Frontend Layer
- `app/` — **Next.js App Router** (67 arquivos)
  - `dashboard/` — Interface principal do sistema com módulos específicos
  - `auth/` — Páginas de autenticação (login/register)
  - `portal/cliente/` — Portal self-service para clientes
  - `admin/` — Interface administrativa para gestão de usuários
  - `api/` — Endpoints RESTful organizados por domínio

### Component Architecture
- `components/` — **Componentes React Reutilizáveis** (72 arquivos)
  - `ui/` — Componentes base do shadcn/ui
  - `dashboard/` — Componentes específicos do dashboard
  - `auth/` — Componentes de autenticação
  - `clientes/` — Componentes de gestão de clientes

### Testing Infrastructure
- `__tests__/` — **Suíte de Testes** (23 arquivos)
  - `api/` — Testes de endpoints
  - `components/` — Testes de componentes React
  - `integration/` — Testes de integração
  - `services/` — Testes de serviços de negócio
- `apply-migration-direct.js/` — approximately 1 files
- `apply-schema.js/` — approximately 1 files
- `check-constraints.js/` — approximately 1 files
- `check-functions.sql/` — approximately 1 files
- `check-rls-policies.js/` — approximately 1 files
- `check-schema-differences.js/` — approximately 1 files
- `check-schema-sync.js/` — approximately 1 files
- `check-table-structure.js/` — approximately 1 files
- `check-tables.js/` — approximately 1 files
- `check-triggers-dashboard.sql/` — approximately 1 files
- `check-triggers.js/` — approximately 1 files
- `check-triggers.sql/` — approximately 1 files
- `components/` — approximately 72 files
- `components.json/` — approximately 1 files
- `coverage/` — approximately 206 files
- `create-tables-direct.js/` — approximately 1 files
- `create-tables-supabase.sql/` — approximately 1 files
- `create-tables.sql/` — approximately 1 files
- `cypress/` — approximately 10 files
- `cypress.config.ts/` — approximately 1 files
- `debug-active-triggers.js/` — approximately 1 files
- `debug-all-functions.js/` — approximately 1 files
- `debug-cnpj.html/` — approximately 1 files
- `debug-insert.js/` — approximately 1 files
- `debug-triggers.js/` — approximately 1 files
- `disable-trigger-temp.js/` — approximately 1 files
- `docs/` — approximately 1 files
- `fix-check-constraint.js/` — approximately 1 files
- `fix-cliente-id-final.js/` — approximately 1 files
- `hooks/` — approximately 7 files
- `investigate-cliente-id.js/` — approximately 1 files
- `investigate-cp-references.sql/` — approximately 1 files
- `investigate-cp.js/` — approximately 1 files
- `investigate.sql/` — approximately 1 files
- `jest.config.api.js/` — approximately 1 files
- `jest.config.js/` — approximately 1 files
- `jest.env.js/` — approximately 1 files
- `jest.setup.js/` — approximately 1 files
- `lib/` — approximately 23 files
- `middleware.ts/` — approximately 1 files
- `migrations/` — approximately 1 files
- `next-env.d.ts/` — approximately 1 files
- `next.config.js/` — approximately 1 files
- `package-lock.json/` — approximately 1 files
- `package.json/` — approximately 1 files
- `postcss.config.js/` — approximately 1 files
- `PRD.md/` — approximately 1 files
- `prisma/` — approximately 1 files
- `public/` — approximately 1 files
- `scripts/` — approximately 15 files
- `SETUP_BANCO.md/` — approximately 1 files
- `setup-database.js/` — approximately 1 files
- `supabase/` — approximately 36 files
- `SUPABASE_MIGRATION.md/` — approximately 1 files
- `tailwind.config.js/` — approximately 1 files
- `test-cnpj-mask.html/` — approximately 1 files
- `test-create-table.js/` — approximately 1 files
- `test-crud-operations.js/` — approximately 1 files
- `test-insert.js/` — approximately 1 files
- `test-prisma-connection.js/` — approximately 1 files
- `testsprite_tests/` — approximately 40 files
- `tsconfig.json/` — approximately 1 files
- `tsconfig.tsbuildinfo/` — approximately 1 files
- `types/` — approximately 5 files
- `verify-tables.js/` — approximately 1 files

## Internal System Boundaries

- Document seams between domains, bounded contexts, or service ownership.
- Note data ownership, synchronization strategies, and shared contract enforcement.

## System Integration Points

- Map inbound interfaces (APIs, events, webhooks) and the modules that own them.
- Capture orchestration touchpoints where this system calls or coordinates other internal services.

## External Service Dependencies

- List SaaS platforms, third-party APIs, or infrastructure services the system relies on.
- Describe authentication methods, rate limits, and failure considerations for each dependency.

## Key Decisions & Trade-offs

- Summarize architectural decisions, experiments, or ADR outcomes that shape the current design.
- Reference supporting documents and explain why selected approaches won over alternatives.

## Diagrams

- Link architectural diagrams or add mermaid definitions here.

## Risks & Constraints

- Document performance constraints, scaling considerations, or external system assumptions.

## Top Directories Snapshot

- `__tests__/` — approximately 23 files
- `app/` — approximately 67 files
- `apply-migration-direct.js/` — approximately 1 files
- `apply-schema.js/` — approximately 1 files
- `check-constraints.js/` — approximately 1 files
- `check-functions.sql/` — approximately 1 files
- `check-rls-policies.js/` — approximately 1 files
- `check-schema-differences.js/` — approximately 1 files
- `check-schema-sync.js/` — approximately 1 files
- `check-table-structure.js/` — approximately 1 files
- `check-tables.js/` — approximately 1 files
- `check-triggers-dashboard.sql/` — approximately 1 files
- `check-triggers.js/` — approximately 1 files
- `check-triggers.sql/` — approximately 1 files
- `components/` — approximately 72 files
- `components.json/` — approximately 1 files
- `coverage/` — approximately 206 files
- `create-tables-direct.js/` — approximately 1 files
- `create-tables-supabase.sql/` — approximately 1 files
- `create-tables.sql/` — approximately 1 files
- `cypress/` — approximately 10 files
- `cypress.config.ts/` — approximately 1 files
- `debug-active-triggers.js/` — approximately 1 files
- `debug-all-functions.js/` — approximately 1 files
- `debug-cnpj.html/` — approximately 1 files
- `debug-insert.js/` — approximately 1 files
- `debug-triggers.js/` — approximately 1 files
- `disable-trigger-temp.js/` — approximately 1 files
- `docs/` — approximately 1 files
- `fix-check-constraint.js/` — approximately 1 files
- `fix-cliente-id-final.js/` — approximately 1 files
- `hooks/` — approximately 7 files
- `investigate-cliente-id.js/` — approximately 1 files
- `investigate-cp-references.sql/` — approximately 1 files
- `investigate-cp.js/` — approximately 1 files
- `investigate.sql/` — approximately 1 files
- `jest.config.api.js/` — approximately 1 files
- `jest.config.js/` — approximately 1 files
- `jest.env.js/` — approximately 1 files
- `jest.setup.js/` — approximately 1 files
- `lib/` — approximately 23 files
- `middleware.ts/` — approximately 1 files
- `migrations/` — approximately 1 files
- `next-env.d.ts/` — approximately 1 files
- `next.config.js/` — approximately 1 files
- `package-lock.json/` — approximately 1 files
- `package.json/` — approximately 1 files
- `postcss.config.js/` — approximately 1 files
- `PRD.md/` — approximately 1 files
- `prisma/` — approximately 1 files
- `public/` — approximately 1 files
- `scripts/` — approximately 15 files
- `SETUP_BANCO.md/` — approximately 1 files
- `setup-database.js/` — approximately 1 files
- `supabase/` — approximately 36 files
- `SUPABASE_MIGRATION.md/` — approximately 1 files
- `tailwind.config.js/` — approximately 1 files
- `test-cnpj-mask.html/` — approximately 1 files
- `test-create-table.js/` — approximately 1 files
- `test-crud-operations.js/` — approximately 1 files
- `test-insert.js/` — approximately 1 files
- `test-prisma-connection.js/` — approximately 1 files
- `testsprite_tests/` — approximately 40 files
- `tsconfig.json/` — approximately 1 files
- `tsconfig.tsbuildinfo/` — approximately 1 files
- `types/` — approximately 5 files
- `verify-tables.js/` — approximately 1 files

## Business Domain Modules

### Core Business Entities
- **Ordens de Serviço** (`app/api/ordens-servico/`, `app/dashboard/ordens-servico/`)
  - Gestão completa do ciclo de vida das ordens
  - Estados: Aberta, Em Andamento, Aguardando Peça, Concluída, Cancelada
  - Integração com sistema de notificações e relatórios

- **Clientes** (`app/api/clientes/`, `app/dashboard/clientes/`)
  - Cadastro e gestão de clientes
  - Portal self-service para acompanhamento
  - Histórico de serviços e comunicação

- **Equipamentos** (`app/api/equipamentos/`, `app/equipamentos/`)
  - Cadastro de dispositivos Apple
  - Histórico de manutenções
  - Garantia e especificações técnicas

- **Financeiro** (`app/dashboard/financeiro/`, `app/dashboard/pagamentos/`)
  - Gestão de pagamentos via Stripe
  - Relatórios financeiros e métricas
  - Controle de recebimentos

### Support Modules
- **Analytics** (`app/api/analytics/`, `app/dashboard/analytics/`)
- **Alerts** (`app/api/alerts/`, `app/dashboard/alerts/`)
- **Relatórios** (`app/api/relatorios/`, `app/dashboard/relatorios/`)
- **Métricas** (`app/api/metrics/`, `app/dashboard/metricas/`)

## Architectural Patterns

### Design Patterns Utilizados
- **Repository Pattern**: Abstração da camada de dados via Prisma
- **Service Layer**: Lógica de negócio centralizada em `lib/services/`
- **Component Composition**: Componentes React modulares e reutilizáveis
- **API-First Design**: Endpoints RESTful bem definidos
- **Role-Based Access Control**: Autorização baseada em perfis de usuário

### Data Flow Architecture
```
Client Request → Middleware (Auth) → API Route → Service Layer → Prisma → Database
                                                      ↓
External APIs ← Business Logic ← Data Validation ← Response
```

### Security Architecture
- **Authentication**: Supabase Auth com JWT tokens
- **Authorization**: Middleware de verificação de roles
- **Data Protection**: Validação de entrada e sanitização
- **API Security**: Rate limiting e CORS configurado

## Key Architectural Decisions

### 1. Monolito Modular vs Microserviços
**Decisão**: Monolito modular com Next.js
**Razão**: Simplicidade de deployment, desenvolvimento mais rápido, menor complexidade operacional
**Trade-offs**: Menor escalabilidade independente, mas adequado para o escopo atual

### 2. Supabase como Backend-as-a-Service
**Decisão**: Supabase para autenticação e banco de dados
**Razão**: Reduz complexidade de infraestrutura, auth pronto, PostgreSQL robusto
**Trade-offs**: Vendor lock-in, mas ganho significativo em velocidade de desenvolvimento

### 3. shadcn/ui para Componentes
**Decisão**: shadcn/ui como base para componentes UI
**Razão**: Componentes modernos, acessíveis, customizáveis, TypeScript nativo
**Trade-offs**: Dependência de biblioteca externa, mas alta qualidade e manutenibilidade

<!-- agent-readonly:guidance -->

## AI Update Checklist

1. Review ADRs, design docs, or major PRs for architectural changes.
2. Verify that each documented decision still holds; mark superseded choices clearly.
3. Capture upstream/downstream impacts (APIs, events, data flows).
4. Update Risks & Constraints with active incident learnings or TODO debt.
5. Link any new diagrams or dashboards referenced in recent work.

<!-- agent-readonly:sources -->

## Acceptable Sources

- ADR folders, `/docs/architecture` notes, or RFC threads.
- Dependency visualisations from build tooling or scripts.
- Issue tracker discussions vetted by maintainers.

## Related Resources

- [Project Overview](./project-overview.md)
- Update [agents/README.md](../agents/README.md) when architecture changes.

<!-- agent-update:end -->
