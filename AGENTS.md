# AGENTS.md

## Dev environment tips

- Install dependencies with `npm install` before running scaffolds.
- Use `npm run dev` for the interactive TypeScript session that powers local experimentation.
- Run `npm run build` to refresh the CommonJS bundle in `dist/` before shipping changes.
- Store generated artefacts in `.context/` so reruns stay deterministic.

## Testing instructions

- Execute `npm run test` to run the Jest suite.
- Append `-- --watch` while iterating on a failing spec.
- Trigger `npm run build && npm run test` before opening a PR to mimic CI.
- Add or update tests alongside any generator or CLI changes.

## PR instructions

- Follow Conventional Commits (for example, `feat(scaffolding): add doc links`).
- Cross-link new scaffolds in `docs/README.md` and `agents/README.md` so future agents can find
  them.
- Attach sample CLI output or generated markdown when behaviour shifts.
- Confirm the built artefacts in `dist/` match the new source changes.

## Repository map

- `__tests__/` — explain what lives here and when agents should edit it.
- `app/` — explain what lives here and when agents should edit it.
- `apply-migration-direct.js/` — explain what lives here and when agents should edit it.
- `apply-schema.js/` — explain what lives here and when agents should edit it.
- `check-constraints.js/` — explain what lives here and when agents should edit it.
- `check-functions.sql/` — explain what lives here and when agents should edit it.
- `check-rls-policies.js/` — explain what lives here and when agents should edit it.
- `check-schema-differences.js/` — explain what lives here and when agents should edit it.

## AI Context References

- Documentation index: `.context/docs/README.md`
- Agent playbooks: `.context/agents/README.md`
- Contributor guide: `CONTRIBUTING.md`
