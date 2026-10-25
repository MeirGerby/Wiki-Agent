---
name: new-lib
description: Scaffold a new shared library under libs/ following Jarvis conventions
---

# New Shared Library

Scaffold a new `libs/` package that matches the conventions the three existing
shared libraries (`@jarvis/db`, `@jarvis/logging`, `@jarvis/ui`) already follow.

## When to use this vs `/nx-generate context`

- **This skill**: A leaf utility consumed by one or more apps (`libs/*`) — no UI
  routes, no BFF routers, just importable code.
- **`@jarvis/nx-plugin:context`**: A full bounded context (`apps/*`) with its own
  contract/bff/web trio. See [[nx-generators]].

Do not use this skill to scaffold a new bounded context.

## Workflow

1. **Ask the user**:
   - Library name (kebab-case, e.g. `auth`, `notifications`)
   - One-line purpose
   - `type:` tag — one of `data`, `util`, `ui` (see [[module-boundaries]]; pick the
     closest fit, or ask if none fit and a new type tag is genuinely needed)
   - Buildable or non-buildable (default: non-buildable, matching all three
     existing libs — see [[nx-generators]] "Buildable vs Non-Buildable")

2. **Run the base generator** (there is no custom `@jarvis/nx-plugin:lib`
   generator today, so start from the Nx plugin generator and layer conventions
   on top):

   ```bash
   nx g @nx/js:library --name=<name> --directory=libs/<name> \
     --bundler=none --unitTestRunner=vitest --dry-run
   ```

   Review the dry-run output, then re-run without `--dry-run`.

3. **Apply Jarvis conventions** the generator won't produce on its own — every
   existing lib agrees on these (see [[jarvis-shared-libs]] "Shared conventions"):

   - `package.json`:
     - `"private": true`
     - `"type": "module"`
     - `"version": "0.0.1"`
     - `exports` map with the `@jarvis/source` condition first, `types`/`import`/
       `default` after — copy the shape from [[conditional-exports]], do not
       hand-roll it differently
   - `tsconfig.json` — the router-only file: `files: []`, `references: [{ path:
     "./tsconfig.lib.json" }]` (see [[typescript-project-references]])
   - `tsconfig.lib.json` — `composite: true`, `declaration: true`,
     `declarationMap: true`, `emitDeclarationOnly: false` (every real lib flips
     this back to `false` — see [[typescript-project-references]] for why)
   - nx tags: `scope:shared`, `type:<data|util|ui>`

4. **Verify wiring**:

   ```bash
   nx sync                      # reconcile tsconfig references
   nx build <name> --dry-run    # confirm it would build
   nx lint <name>                # confirm no boundary violations from day one
   ```

5. **Scaffold a minimal public surface**: `src/index.ts` exporting one real thing
   (a function, a factory, a schema) — not an empty file. Match the "factory, not
   singleton" pattern from `@jarvis/db`'s `createDb` if the library holds any
   stateful resource.

## Output

Report back:

- Files created (list)
- Tags applied
- Whether `nx sync` needed to change anything
- Reminder: update [[jarvis-shared-libs]] wiki page if this library is meant to be
  documented as a fourth shared library (this skill does not touch the wiki)

## Notes

- **Does not auto-decide** the `type:` tag — ambiguous cases go back to the user
  rather than guessing, since a wrong tag becomes a silent boundary hole later.
- **Does not publish** — every existing lib is `private: true`; this skill never
  sets up npm publishing.
- If the new library needs to import from an existing library, stop and flag it —
  today's rule is that libs are leaves with `"references": []` between them (see
  [[jarvis-shared-libs]] "Mental Model"). A lib-to-lib dependency is a deliberate
  architecture change, not something this skill should do quietly.

## Related Pages

- [[jarvis-shared-libs]] — The conventions this skill encodes
- [[conditional-exports]] — The exact `exports` map shape to copy
- [[typescript-project-references]] — The tsconfig router/lib split
- [[module-boundaries]] — What `type:` tags mean and enforce
- [[nx-generators]] — Buildable vs non-buildable, and the context generator this is not
- [[nx-common-commands]] — `nx sync`, `nx g`, dry-run patterns
