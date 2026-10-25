# Jarvis Development Guidelines

## Definition

Guidelines for how agents and developers should work within the Jarvis repository. These are
conventions that keep the codebase consistent, prevent patterns that don't scale, and make
collaboration predictable across team members (human and AI).

## Mental Model

Development guidelines are not laws — they are agreements about how to do work together. When
an agent says "don't do X", it's not arbitrary; there's a reason behind it (previous incident,
scaling problem, maintainability concern). This page collects those reasons so new team members
understand the intent, not just the rule.

## Language

**Use Simplified Technical English (ASD-STE100)** when talking to agents.

Simplified Technical English is a restricted subset of English designed for clarity and
internationalization. It prioritizes:
- Short, simple sentences
- Common words (prefer "use" over "utilize")
- Active voice
- Consistency (same word for same concept)

This matters because:
- Agents have clearer instructions when language is predictable
- Non-native English speakers (including future localization) benefit
- Ambiguity is minimized — less room for misinterpretation

## Comments

**Be very picky about which comments you write.**

Anti-pattern: Over-commenting every line, or stating what the code does ("add 5 to x").

When to write a comment:
- The **why** is non-obvious (hidden constraint, architectural decision, workaround for a specific bug)
- Behavior would surprise a future reader (e.g., "this order matters for cache keys")
- Referencing external documentation (issue, RFC, spec) that isn't obvious from code alone

When NOT to write a comment:
- The code is clear enough that well-named variables and functions explain it
- You'd be repeating what the code already says
- You'd be duplicating documentation that belongs in the PR description or README

**Principle**: Code should be readable without comments. Comments are for surprises.

## Nx Workspace Patterns

These are Nx-specific guidelines. See [[nx-monorepo]], [[nx-task-execution]], and
[[nx-common-commands]] for details.

### Running Tasks

- **Always use `pnpm nx`** instead of calling tools directly (e.g., `pnpm nx build @jarvis/db`,
  not `cd libs/db && npm run build`)
- **Prefix commands with the workspace package manager** (`pnpm nx`, not bare `nx`) — avoids
  relying on global installs
- **Prefer `nx affected` on feature branches** (has meaningful diff), and `nx run-many` on main
  or release branches

### Task Discovery

- **Consult Nx docs** for advanced config options, unfamiliar flags, migration guides
- **Use `--help`** first when unsure of a flag
- **Check `node_modules/@nx/<plugin>/PLUGIN.md`** for plugin-specific best practices

### Generators & Scaffolding

- **Always invoke the `/nx-generate` skill FIRST** before exploring or calling MCP tools
- **Use `--dry-run`** to preview what a generator will create before committing
- **Prefer workspace generators** over plugin generators — they know your repo's patterns
- **Read the generator source** to understand side effects

### Module Boundaries

- **Module boundary violations are caught early** via `nx lint` in CI
- **Use `@nx/enforce-module-boundaries` ESLint rule** — it's enforced in every PR
- **Tags matter**: `scope:model-catalog`, `type:web`, etc. Wrong tags = silent boundary holes
- **Never try to work around module boundaries** — they're there to prevent coupling

See [[module-boundaries]] for the full rules and [[audit-boundaries]] for the Claude skill that
validates them.

## Agent Skill Patterns

See [[jarvis-agent-skills]] and [[linear-issue-tracker]] for full context.

### Issue Tracker

- Issues live in **Linear**, team **Jarvis**
- PRs live on **GitHub** (`ten-li-po-ahat/Jarvis`)
- Link PRs to issues with `Closes JAR-123` in the body
- Five triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`

### Domain Documentation

- **One glossary per bounded context**: `apps/<context>/docs/CONTEXT.md`
- **Shared map**: `CONTEXT-MAP.md` at repo root, pointing to each context's glossary
- **Architectural decisions**: `docs/adr/` directory
- **Lazy creation**: Glossaries are created when the context exists, not in advance
- **Contradictions are preserved, not silently resolved**: Flag disagreements explicitly

See [[bounded-contexts]] for the full convention.

### Skill Composition

Skills can compose other skills (e.g., `/grill-prd` invokes `/grill-me` then `/to-prd`).

When composing:
- **Keep skills focused** — each skill does one thing well
- **Use `disable-model-invocation` wisely** — if a skill's entire value is enforcing a boundary
  (e.g., "product manager, not engineer"), don't let the model reach for it automatically
- **Config files stay separate from logic** — skill behavior is generic, repo-specific config
  (`triage-labels.md`, `domain.md`) is separate

## Database & Schema

**Schema is read from introspection, not authored**.

- **Run `drizzle-kit generate`** to create migrations
- **Never hand-edit migrations** — let the tool generate them
- **Always use an ORM for migrations** — direct SQL is error-prone
- **Know the difference**: `schema.ts` describes what you *want*; migrations describe what you did

See [[schema-source-of-truth]] for when they disagree and why.

## Version Control

- **Commit message**: Describe the **why**, not the what
- **Commit often**: Small, focused commits are better than large ones
- **Reference issues**: `Closes JAR-123` in the PR body links work to the tracker
- **Branch name**: Use the `gitBranchName` from the Linear issue

## Related Concepts

- [[nx-monorepo]] — How Nx enforces workspace structure
- [[module-boundaries]] — Dependency rules enforced in every lint run
- [[jarvis-agent-skills]] — How skills are organized and scoped
- [[bounded-contexts]] — Domain organization and glossaries
- [[linear-issue-tracker]] — Issue tracker operations and conventions
- [[schema-source-of-truth]] — When schema and migrations disagree

## Sources

- [[raw/jarvis/CLAUDE.md]] — Project-level development guide
- [[raw/jarvis/AGENTS.md]] — Agent skill conventions
- [[raw/docs/nx.md]] — Nx workspace configuration reference

Simplified Technical English (ASD-STE100) is a real standard; the preamble about its benefits
is general knowledge applied to why it matters here. The comment philosophy (be picky, prefer
code clarity) is both best practice and this project's explicit preference. All other guidelines
are read directly from the source or inferred from patterns in the codebase.
