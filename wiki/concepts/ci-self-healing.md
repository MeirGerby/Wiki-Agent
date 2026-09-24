# CI Self-Healing

## Definition

An automated process where a CI monitoring agent detects build failures, analyzes whether they're code issues or environment issues, applies fixes locally with verification, and pushes corrections back to the repository. The agent respects budget gates to prevent infinite fix loops.

## Mental Model

Imagine a quality inspector on a factory line. When something breaks, the inspector checks whether it's a broken machine (environment) or a faulty product (code). If it's the product, they fix it, test it, and send it back. If it's the machine, they alert the operator. The inspector also tracks how many times they've tried fixing the same issue to prevent wasting time.

## Key Status Codes & Responses

| Status | Meaning | Action |
|--------|---------|--------|
| `fix_apply_ready` | Fix generated, ready to apply | Apply via MCP or locally |
| `fix_needs_local_verify` | Fix needs local testing | Run verifiable tasks in parallel, then apply if passing |
| `fix_needs_review` | Fix needs human judgment | Analyze fix content; apply, enhance, or reject |
| `fix_auto_apply_skipped` | Fix skipped (e.g., Nx Cloud trigger) | Offer manual apply to user |
| `fix_failed` / `no_fix` | No fix generated | Attempt local fix with gate budget |
| `environment_issue` | Env/tooling problem detected | Skip code fix, rerun environment |
| `self_healing_throttled` | Too many fix attempts | Reject previous fixes, attempt one more locally |

## Fix Action Flows

### Apply via MCP
Direct application through update subagent. CI respawns automatically.

### Apply Locally + Enhance
1. Apply fix locally with `nx-cloud apply-locally`
2. Enhance code if needed
3. Run failing tasks to verify
4. If still failing: commit current state and push (let CI judge) OR loop back if budget allows
5. If passing: commit and push

### Reject + Fix From Scratch
1. Reject the generated fix
2. Fix locally from scratch
3. Commit and push

## Environment vs Code Failures

**Environment/tooling issues** (don't consume fix budget):
- Command not found, binary missing
- OOM / heap allocation failures
- Permission denied
- Network timeouts / DNS failures
- Missing system libraries, Docker/container issues
- Disk space exhaustion

**Code failures** (consume fix budget):
- Compilation errors
- Test assertion failures
- Lint violations
- Type errors

## Budget Gates

The system uses `ci-state-update.mjs gate` to prevent infinite loops:

```bash
ci-state-update.mjs gate --gate-type local-fix    # check budget for code fixes
ci-state-update.mjs gate --gate-type env-rerun    # check budget for env retries
```

If budget exhausted, the agent commits empty/current state and exits.

## Git Safety

- Always stage specific files by name: `git add <file1> <file2>`
- Never use `git add -A` or `git add .` (risks committing unrelated work or secrets)
- Commit format includes failed task IDs and verification status

## Related Concepts

- [[nx-monorepo]]
- [[module-boundaries]]
- [[ci-monitoring]] — Polling loop that produces these fix states
- [[ci-pipeline]] — The pipeline whose failures these fixes target

## Sources

- [[raw/jarvis/agents/skills/monitor-ci/references/fix-flows.md]]
