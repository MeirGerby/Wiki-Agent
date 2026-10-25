---
name: audit-boundaries
description: Validate PR against module-boundary ESLint rules before merging
---

# Audit Module Boundaries

Check if a branch violates Nx module-boundary rules.

## Workflow

1. **Get the base branch** from the user (default: `origin/main`)
2. **Run affected linting** on the current branch
3. **Parse ESLint violations** for `@nx/enforce-module-boundaries` only
4. **Group violations** by file and rule
5. **Explain each violation** with context and fix options
6. **Report summary** (pass/fail, count of violations)

## Execution

```bash
# Fetch updated main to ensure accurate affected calculation
git fetch origin main

# Run lint on affected projects, capture violations
pnpm nx affected -t lint --base=origin/main 2>&1 | tee /tmp/lint-output.txt

# Parse for @nx/enforce-module-boundaries errors
grep -E "@nx/enforce-module-boundaries|error.*boundary" /tmp/lint-output.txt
```

## Output Format

If violations are found, display:

```
┌─────────────────────────────────────────────────────────┐
│ Module Boundary Violations (3 found)                    │
├─────────────────────────────────────────────────────────┤

📄 apps/model-catalog/web/src/services/upload.ts
  ❌ Cannot import from @jarvis/db
     Rule: type:web → cannot use: type:data
     
  Options to fix:
  1. Move file to apps/model-catalog/bff/src/services/ (correct layer)
  2. Create a contract in apps/model-catalog/contract/ for this logic
  3. Request waiver in nx.json (if intentional)
  
─────────────────────────────────────────────────────────

📄 apps/model-catalog/bff/src/routers/index.ts
  ❌ Cannot import from @jarvis/ui/components
     Rule: type:bff → cannot use: type:ui
     
  Options to fix:
  1. Move component usage to web app (BFF should not render)
  2. Export component data via contract, let web render

─────────────────────────────────────────────────────────

✅ No other violations found

Summary: 2 files, 2 projects affected, 3 rules violated
```

If clean:

```
✅ No module boundary violations found on this branch.
Branch is ready to merge.
```

## Notes

- Only checks **affected** projects (use `--base=origin/main` for feature branches)
- Only reports **@nx/enforce-module-boundaries** errors (other lint issues ignored)
- **Does not auto-fix** — humans decide whether to refactor or request waiver
- Works locally or in CI (no special setup needed beyond `pnpm` + `nx`)

## Related Pages

- [[nx-monorepo]] — Nx workspace structure
- [[module-boundaries]] — The boundary rules explained
- [[nx-task-execution]] — How affected projects are calculated
- [[nx-common-commands]] — All Nx lint commands
