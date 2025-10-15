<!-- agent-update:start:docs-index -->

# Documentation Index

Welcome to the repository knowledge base. Start with the project overview, then dive into specific
guides as needed.

## Core Guides

- [Project Overview](./project-overview.md)
- [Architecture Notes](./architecture.md)
- [Development Workflow](./development-workflow.md)
- [Testing Strategy](./testing-strategy.md)
- [Glossary & Domain Concepts](./glossary.md)
- [Data Flow & Integrations](./data-flow.md)
- [Security & Compliance Notes](./security.md)
- [Tooling & Productivity Guide](./tooling.md)

## Repository Snapshot

- `__tests__/`
- `app/`
- `apply-migration-direct.js/`
- `apply-schema.js/`
- `check-constraints.js/`
- `check-functions.sql/`
- `check-rls-policies.js/`
- `check-schema-differences.js/`
- `check-schema-sync.js/`
- `check-table-structure.js/`
- `check-tables.js/`
- `check-triggers-dashboard.sql/`
- `check-triggers.js/`
- `check-triggers.sql/`
- `components/`
- `components.json/`
- `coverage/`
- `create-tables-direct.js/`
- `create-tables-supabase.sql/`
- `create-tables.sql/`
- `cypress/`
- `cypress.config.ts/`
- `debug-active-triggers.js/`
- `debug-all-functions.js/`
- `debug-cnpj.html/`
- `debug-insert.js/`
- `debug-triggers.js/`
- `disable-trigger-temp.js/`
- `docs/` — Living documentation produced by this tool.
- `fix-check-constraint.js/`
- `fix-cliente-id-final.js/`
- `hooks/`
- `investigate-cliente-id.js/`
- `investigate-cp-references.sql/`
- `investigate-cp.js/`
- `investigate.sql/`
- `jest.config.api.js/`
- `jest.config.js/`
- `jest.env.js/`
- `jest.setup.js/`
- `lib/`
- `middleware.ts/`
- `migrations/`
- `next-env.d.ts/`
- `next.config.js/`
- `package-lock.json/`
- `package.json/`
- `postcss.config.js/`
- `PRD.md/`
- `prisma/`
- `public/`
- `scripts/`
- `SETUP_BANCO.md/`
- `setup-database.js/`
- `supabase/`
- `SUPABASE_MIGRATION.md/`
- `tailwind.config.js/`
- `test-cnpj-mask.html/`
- `test-create-table.js/`
- `test-crud-operations.js/`
- `test-insert.js/`
- `test-prisma-connection.js/`
- `testsprite_tests/`
- `tsconfig.json/`
- `tsconfig.tsbuildinfo/`
- `types/`
- `verify-tables.js/`

## Document Map

| Guide                        | File                      | AI Marker                         | Primary Inputs                                          |
| ---------------------------- | ------------------------- | --------------------------------- | ------------------------------------------------------- |
| Project Overview             | `project-overview.md`     | agent-update:project-overview     | Roadmap, README, stakeholder notes                      |
| Architecture Notes           | `architecture.md`         | agent-update:architecture-notes   | ADRs, service boundaries, dependency graphs             |
| Development Workflow         | `development-workflow.md` | agent-update:development-workflow | Branching rules, CI config, contributing guide          |
| Testing Strategy             | `testing-strategy.md`     | agent-update:testing-strategy     | Test configs, CI gates, known flaky suites              |
| Glossary & Domain Concepts   | `glossary.md`             | agent-update:glossary             | Business terminology, user personas, domain rules       |
| Data Flow & Integrations     | `data-flow.md`            | agent-update:data-flow            | System diagrams, integration specs, queue topics        |
| Security & Compliance Notes  | `security.md`             | agent-update:security             | Auth model, secrets management, compliance requirements |
| Tooling & Productivity Guide | `tooling.md`              | agent-update:tooling              | CLI scripts, IDE configs, automation workflows          |

<!-- agent-readonly:guidance -->

## AI Update Checklist

1. Gather context with `git status -sb` plus the latest commits touching `docs/` or `agents/`.
2. Compare the current directory tree against the table above; add or retire rows accordingly.
3. Update cross-links if guides moved or were renamed; keep anchor text concise.
4. Record sources consulted inside the commit or PR description for traceability.

<!-- agent-readonly:sources -->

## Acceptable Sources

- Repository tree and `package.json` scripts for canonical command names.
- Maintainer-approved issues, RFCs, or product briefs referenced in the repo.
- Release notes or changelog entries that announce documentation changes.

<!-- agent-update:end -->
