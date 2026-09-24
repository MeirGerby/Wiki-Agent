---
id: a-ci-skips-some-fixes
question: q-ci-skips-some-fixes
concepts:
  - ci-self-healing
  - ci-monitoring
origin: generated
---

# It decided the failure was environmental, not a code bug

## Short answer

The agent classifies each failure before acting. Environment and tooling failures are not code defects, so attempting a code fix would burn budget and change nothing.

## The classification

**Environment / tooling** -- bail immediately, consume no budget:

- command not found, missing binary
- OOM or heap allocation failure
- permission denied
- network timeout or DNS failure
- missing system libraries, Docker or container problems
- disk space exhausted

**Code** -- a genuine fix candidate, proceeds through the gate:

- compilation errors
- test assertion failures
- lint violations
- type errors

## Why the budget matters

Before any local fix the agent runs a gate:

```bash
ci-state-update.mjs gate --gate-type local-fix
```

Exhausted budget means it reports and stops rather than looping. Three counters
bound the whole run: cycles, local fix attempts, and environment reruns. Progress
is tracked separately, and a stall trips a circuit breaker -- see
[[ci-monitoring]].

## Sources

- [[raw/jarvis/agents/skills/monitor-ci/references/fix-flows.md]]

## Question

- [[q-ci-skips-some-fixes]]

## Related Concepts

- [[ci-self-healing]]
- [[ci-monitoring]]
