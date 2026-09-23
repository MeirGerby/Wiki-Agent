# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase. This is a **multi-context** Nx monorepo: one context per app under `apps/`.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root — it has one row per app, and points at that app's glossary, `apps/<app>/docs/CONTEXT.md`. Read each one relevant to the topic.
- **`docs/adr/`** — system-wide decisions. Also check `apps/<app>/docs/adr/` for decisions of that context.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
└── apps/
    └── model-catalog/
        └── docs/
            ├── CONTEXT.md
            └── adr/                   ← context-specific decisions
```

One app has one glossary. A lib has no glossary: its words belong to the context that uses them.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in any glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
