<!-- agent-update:start:agent-bug-fixer -->

# Bug Fixer Agent Playbook

## Mission

Describe how the bug fixer agent supports the team and when to engage it.

## Responsibilities

- Analyze bug reports and error messages
- Identify root causes of issues
- Implement targeted fixes with minimal side effects
- Test fixes thoroughly before deployment

## Best Practices

- Reproduce the bug before fixing
- Write tests to prevent regression
- Document the fix for future reference

## Key Project Resources

- Documentation index: [docs/README.md](../docs/README.md)
- Agent handbook: [agents/README.md](./README.md)
- Agent knowledge base: [AGENTS.md](../../AGENTS.md)
- Contributor guide: [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Repository Starting Points

- `__tests__/` — TODO: Describe the purpose of this directory.
- `app/` — TODO: Describe the purpose of this directory.
- `components/` — TODO: Describe the purpose of this directory.
- `coverage/` — TODO: Describe the purpose of this directory.
- `cypress/` — TODO: Describe the purpose of this directory.
- `docs/` — TODO: Describe the purpose of this directory.
- `hooks/` — TODO: Describe the purpose of this directory.
- `lib/` — TODO: Describe the purpose of this directory.
- `migrations/` — TODO: Describe the purpose of this directory.
- `prisma/` — TODO: Describe the purpose of this directory.
- `public/` — TODO: Describe the purpose of this directory.
- `scripts/` — TODO: Describe the purpose of this directory.
- `supabase/` — TODO: Describe the purpose of this directory.
- `testsprite_tests/` — TODO: Describe the purpose of this directory.
- `types/` — TODO: Describe the purpose of this directory.

## Documentation Touchpoints

- [Documentation Index](../docs/README.md) — agent-update:docs-index
- [Project Overview](../docs/project-overview.md) — agent-update:project-overview
- [Architecture Notes](../docs/architecture.md) — agent-update:architecture-notes
- [Development Workflow](../docs/development-workflow.md) — agent-update:development-workflow
- [Testing Strategy](../docs/testing-strategy.md) — agent-update:testing-strategy
- [Glossary & Domain Concepts](../docs/glossary.md) — agent-update:glossary
- [Data Flow & Integrations](../docs/data-flow.md) — agent-update:data-flow
- [Security & Compliance Notes](../docs/security.md) — agent-update:security
- [Tooling & Productivity Guide](../docs/tooling.md) — agent-update:tooling

<!-- agent-readonly:guidance -->

## Collaboration Checklist

1. Confirm assumptions with issue reporters or maintainers.
2. Review open pull requests affecting this area.
3. Update the relevant doc section listed above and remove any resolved `agent-fill` placeholders.
4. Capture learnings back in [docs/README.md](../docs/README.md) or the appropriate task marker.

## Success Metrics

Track effectiveness of this agent's contributions:

- **Code Quality:** Reduced bug count, improved test coverage, decreased technical debt
- **Velocity:** Time to complete typical tasks, deployment frequency
- **Documentation:** Coverage of features, accuracy of guides, usage by team
- **Collaboration:** PR review turnaround time, feedback quality, knowledge sharing

**Target Metrics:**

- TODO: Define measurable goals specific to this agent (e.g., "Reduce bug resolution time by 30%")
- TODO: Track trends over time to identify improvement areas

## Troubleshooting Common Issues

Document frequent problems this agent encounters and their solutions:

### Issue: [Common Problem]

**Symptoms:** Describe what indicates this problem **Root Cause:** Why this happens **Resolution:**
Step-by-step fix **Prevention:** How to avoid in the future

**Example:**

### Issue: Build Failures Due to Outdated Dependencies

**Symptoms:** Tests fail with module resolution errors **Root Cause:** Package versions incompatible
with codebase **Resolution:**

1. Review package.json for version ranges
2. Run `npm update` to get compatible versions
3. Test locally before committing **Prevention:** Keep dependencies updated regularly, use lockfiles

## Hand-off Notes

Summarize outcomes, remaining risks, and suggested follow-up actions after the agent completes its
work.

## Evidence to Capture

- Reference commits, issues, or ADRs used to justify updates.
- Command output or logs that informed recommendations.
- Follow-up items for maintainers or future agent runs.
- Performance metrics and benchmarks where applicable.
<!-- agent-update:end -->
