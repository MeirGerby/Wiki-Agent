# CI Monitoring

## Definition

A system for continuously polling a CI pipeline's status, making deterministic decisions about next actions (wait, retry, apply fix, or exit), and tracking progress through configurable budgets to prevent infinite loops or wasted resources.

## Mental Model

Imagine a traffic controller at an intersection. They continuously observe the traffic flow, classify what's happening (cars moving, gridlock, accident), make deterministic decisions about next actions (keep light green, switch to red, call for cleanup), and track how many times they've cycled to prevent wasting time on stuck situations.

## Architecture

**Four layers** working together:

1. **Orchestrator skill** (`monitor-ci`) — Main control flow, spawns subagents, runs scripts, handles git operations
2. **Subagents** (Haiku, lightweight) — Call one MCP tool each (`ci_information` or `update_self_healing_fix`), return structured result
3. **Decision script** (`ci-poll-decide.mjs`) — Deterministic state classifier, outputs action (poll/wait/done) + code + message
4. **State script** (`ci-state-update.mjs`) — Three commands:
   - `gate` — Check if budget allows the action (local-fix or env-rerun)
   - `post-action` — Track state after an action (wait mode, expected commit)
   - `cycle-check` — Classify cycles, enforce max-cycles limit

## Polling States

The decision script classifies CI into one of ~20 states:

**Terminal states** (exit):
- `ci_success` — CI passed
- `cipe_canceled` — User canceled
- `cipe_timed_out` — CI timeout
- `polling_timeout` — Monitor timeout
- `circuit_breaker` — No progress after 13 consecutive polls

**Wait states** (sleep and recheck):
- `polling` — Still working, wait and poll
- `error` — Script error, retry after 60s
- `fix_auto_applying` — Self-healing is running, track but don't interfere

**Action states** (require orchestrator handling):
- `fix_apply_ready` — Fix generated and verified, apply via MCP
- `fix_needs_local_verify` — Run failing tasks locally, then apply or enhance
- `fix_needs_review` — Analyze fix; apply, enhance, or reject
- `fix_failed` / `no_fix` — Attempt local fix (with gate check)
- `environment_issue` — Request environment rerun
- `self_healing_throttled` — Reject old fixes, attempt one more locally
- `no_new_cipe` — CI Attempt never spawned, try auto-fix workflow
- `cipe_no_tasks` — CI failed with no tasks, retry once

## Budgets & Gates

Three counters prevent infinite loops:

| Budget | Name | Default | Checked By |
|--------|------|---------|-----------|
| **Cycles** | `--max-cycles` | 10 | `cycle-check` gate (hard stop if exceeded) |
| **Local Fix Attempts** | `--local-verify-attempts` | 3 | `gate --gate-type local-fix` |
| **Env Reruns** | (implicit) | 2 | `gate --gate-type env-rerun` |

Progress tracking prevents budget waste:
- No progress after 5 consecutive polls → backoff
- No progress after 13 consecutive polls → circuit breaker (exit)
- Progress = any change in `cipeStatus`, `selfHealingStatus`, `verificationStatus`, or `failureClassification`

## MCP Tool Efficiency

Three field sets balance data fetching vs context usage:

| Field Set | Fields | Use Case |
|-----------|--------|----------|
| **WAIT_FIELDS** | cipeUrl, commitSha, cipeStatus | Light polling in wait mode |
| **LIGHT_FIELDS** | Status + hints + verification + self-healing metadata | Normal polling |
| **HEAVY_FIELDS** | + taskOutputSummary, suggestedFix, suggestedFixDescription | Analyzing fixes for decisions |

## Anti-Patterns to Avoid

- Using CI provider CLI with `--watch` (bypasses self-healing)
- Independently analyzing failures while polling (races with self-healing)
- Canceling CI workflows (loses progress)
- Custom polling scripts (unreliable, wastes context)

## Related Concepts

- [[ci-self-healing]]
- [[nx-monorepo]]
- [[ci-pipeline]] — The pipeline being watched (this page is the watcher, not the pipeline)

## Sources

- [[raw/jarvis/agents/skills/monitor-ci/SKILL.md]]
- [[raw/jarvis/agents/skills/monitor-ci/scripts/ci-poll-decide.mjs]]
- [[raw/jarvis/agents/skills/monitor-ci/scripts/ci-state-update.mjs]]
