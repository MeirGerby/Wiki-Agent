# Jarvis Agent Skill Conventions

## Definition

A pattern for keeping AI-agent skills generic while making them behave correctly in
one specific repository: the skill's logic stays repo-agnostic, and a small
markdown file under `docs/agents/` or alongside the skill supplies the facts that
differ per repo — label names, glossary locations, product-vs-technical scope.

## Mental Model

Think of the skill as compiled code and the repo-specific file as its configuration.
The same `/triage` skill logic runs in any repository; only `triage-labels.md`
changes to say what this repo's issue tracker actually calls "ready for an AFK
agent." Move the skill to a different repo, swap the config file, nothing about the
skill itself changes.

This is the same instinct as [[ci-monitoring]] and [[ci-self-healing]]: those skills
also separate a generic orchestrator from repo-specific state (budgets, thresholds)
— configuration kept out of the logic that consumes it.

## Where these files live

```
raw/jarvis/
├── docs/agents/
│   ├── domain.md            ← how to consume this repo's domain docs
│   └── triage-labels.md     ← this repo's issue-tracker label vocabulary
└── claude/
    └── grill-prd/
        └── SKILL.md         ← a skill definition, scoped for this repo's use
```

`docs/agents/*.md` files are **read by** skills — reference data a skill loads to
adapt its generic behavior. `claude/*/SKILL.md` files **are** skill definitions
themselves, with YAML front matter (`name`, `description`,
`disable-model-invocation`).

## Triage labels: renaming a vocabulary, not the workflow

```markdown
| Label in mattpocock/skills | Label in our tracker | Meaning |
| --------------------------- | --------------------- | ------- |
| `needs-triage`              | `needs-triage`        | ... |
| `ready-for-agent`           | `ready-for-agent`     | Fully specified, ready for an AFK agent |
```

The generic skill (from an external skills package, `mattpocock/skills`) speaks in
five canonical roles. This file is purely a rename table into "whatever vocabulary
you actually use" in this repo's Linear tracker — in Jarvis's case the names happen
to match one-for-one, but the file exists so a repo where they *don't* match only
needs this table edited, not the skill.

One operational note: **the labels don't exist in Linear yet.** The file instructs
the skill to create a label with `save_issue_label` the first time it's needed,
rather than requiring someone to pre-provision them.

## The grill-prd skill: scoping by audience

```markdown
---
name: grill-prd
description: Run a product focused grilling session (no technical questions), then turning the grilling session output into a published PRD.
disable-model-invocation: true
---
```

Two lines of process:

1. Invoke `/grill-me`, scoped to the idea.
2. Invoke `/to-prd` on the resulting context.

The entire skill body is a **constraint**, not new logic: "the invoker is a product
manager, not a software engineer... DO NOT ask any technical or implementation
questions." It composes two more general skills (`/grill-me` — an interrogation
session, `/to-prd` — turning context into a PRD) and narrows their combined
behavior for one specific persona.

`disable-model-invocation: true` means the model cannot decide on its own to invoke
this skill mid-conversation — a human has to call it explicitly. *Inference:*
appropriate for a skill whose entire value is enforcing a strict question boundary;
letting the model reach for it automatically would defeat the reason it exists.

## Domain documentation: the third instance of the same pattern

`docs/agents/domain.md` tells engineering skills how to find this repo's
domain vocabulary before touching code — `CONTEXT-MAP.md`, per-context
`CONTEXT.md` glossaries, and `docs/adr/`. See [[bounded-contexts]] for the full
convention; it is documented there because it is really about how bounded contexts
describe themselves, not about skills in general. It is listed here as the third
example of the same shape: generic skill (`/domain-modeling`, reached via
`/grill-with-docs`), repo-specific data (the actual glossaries and ADRs) kept
separate from it.

## Related Concepts

- [[bounded-contexts]] — The domain-documentation convention these skills read
- [[ci-monitoring]] — Another generic-orchestrator / repo-specific-state split
- [[ci-self-healing]] — Same split, applied to fix budgets and thresholds
- [[nx-generators]] — A different kind of repo-specific configuration (scaffolding templates rather than agent behavior)

## Sources

- [[raw/jarvis/docs/agents/triage-labels.md]]
- [[raw/jarvis/claude/grill-prd/SKILL.md]]
- [[raw/jarvis/docs/agents/domain.md]]

The generic skills referenced (`mattpocock/skills` triage roles, `/grill-me`,
`/to-prd`, `/domain-modeling`) are named in these files but their own logic is not
among the sources read — what they do is described only as much as these
configuration files describe it. The "compiled code vs configuration" framing is
this wiki's own model for what is otherwise an unlabeled pattern in the source
files.
