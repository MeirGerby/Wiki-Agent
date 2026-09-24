---
name: "source-command-ingest"
description: "Migrated source command `ingest`"
---

# source-command-ingest

Use this skill when the user asks to run the migrated source command `ingest`.

## Command Template

# /ingest

Process new learning material from `raw/`.

Follow the rules in `AGENTS.md`.

Steps:

1. Find new or relevant material in `raw/`.
2. Read the material.
3. Identify important concepts.
4. Search `wiki/` for existing related pages.
5. Update existing pages when possible.
6. Create new pages only when necessary.
7. Add links between related concepts.
8. Update `index.md`.
9. Append the operation to `log.md`.
10. Report what changed.

Never modify files inside `raw/`.
