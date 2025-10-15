<!-- agent-update:start:data-flow -->

# Data Flow & Integrations

Explain how data enters, moves through, and exits the system, including interactions with external
services.

## High-level Flow

- Summarize the primary pipeline from input to output. Reference diagrams or embed Mermaid
  definitions when available.

## Internal Movement

- Describe how modules within `__tests__`, `app`, `apply-migration-direct.js`, `apply-schema.js`,
  `check-constraints.js`, `check-functions.sql`, `check-rls-policies.js`,
  `check-schema-differences.js`, `check-schema-sync.js`, `check-table-structure.js`,
  `check-tables.js`, `check-triggers-dashboard.sql`, `check-triggers.js`, `check-triggers.sql`,
  `components`, `components.json`, `coverage`, `create-tables-direct.js`,
  `create-tables-supabase.sql`, `create-tables.sql`, `cypress`, `cypress.config.ts`,
  `debug-active-triggers.js`, `debug-all-functions.js`, `debug-cnpj.html`, `debug-insert.js`,
  `debug-triggers.js`, `disable-trigger-temp.js`, `docs`, `fix-check-constraint.js`,
  `fix-cliente-id-final.js`, `hooks`, `investigate-cliente-id.js`, `investigate-cp-references.sql`,
  `investigate-cp.js`, `investigate.sql`, `jest.config.api.js`, `jest.config.js`, `jest.env.js`,
  `jest.setup.js`, `lib`, `middleware.ts`, `migrations`, `next-env.d.ts`, `next.config.js`,
  `package-lock.json`, `package.json`, `postcss.config.js`, `PRD.md`, `prisma`, `public`, `scripts`,
  `SETUP_BANCO.md`, `setup-database.js`, `supabase`, `SUPABASE_MIGRATION.md`, `tailwind.config.js`,
  `test-cnpj-mask.html`, `test-create-table.js`, `test-crud-operations.js`, `test-insert.js`,
  `test-prisma-connection.js`, `testsprite_tests`, `tsconfig.json`, `tsconfig.tsbuildinfo`, `types`,
  `verify-tables.js` collaborate (queues, events, RPC calls, shared databases).

## External Integrations

- <!-- agent-fill:integration -->**Integration** — Purpose, authentication, payload shapes, retry strategy.<!-- /agent-fill -->

## Observability & Failure Modes

- Metrics, traces, or logs that monitor the flow.
- Backoff, dead-letter, or compensating actions when downstream systems fail.

<!-- agent-readonly:guidance -->

## AI Update Checklist

1. Validate flows against the latest integration contracts or diagrams.
2. Update authentication, scopes, or rate limits when they change.
3. Capture recent incidents or lessons learned that influenced reliability.
4. Link to runbooks or dashboards used during triage.

<!-- agent-readonly:sources -->

## Acceptable Sources

- Architecture diagrams, ADRs, integration playbooks.
- API specs, queue/topic definitions, infrastructure code.
- Postmortems or incident reviews impacting data movement.

<!-- agent-update:end -->
