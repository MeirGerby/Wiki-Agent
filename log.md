# Wiki Log

## [2026-09-16] init | Created learning wiki

- Created wiki structure.
- Created AGENTS.md.
- Created index.md.

## [2026-09-16] ingest | Processed raw/linux/grep.md

- Created: [[wiki/concepts/stdin]]
- Created: [[wiki/concepts/stdout]]
- Created: [[wiki/concepts/regex]]
- Created: [[wiki/concepts/recursive-search]]
- Created: [[wiki/commands/grep]]
- Updated: index.md

## [2026-09-16] ingest | Processed raw/linux/pipes.md

- Created: [[wiki/concepts/pipes]]
- Created: [[wiki/concepts/stderr]]
- Updated: [[wiki/concepts/stdin]]
- Updated: [[wiki/concepts/stdout]]

## [2026-09-16] ingest | Processed sed.md and awk.md

- Created: [[wiki/commands/sed]]
- Created: [[wiki/commands/awk]]
- Updated: index.md

## [2026-09-17] lint | Fixed wiki health issues

- Removed: Non-existent Programming section from index.md
- Updated: [[wiki/commands/awk]] - added links to regex, pipes, sed
- Updated: [[wiki/commands/sed]] - added links to pipes, awk
- Fixed: Broken cross-references between command pages

## [2026-09-23] ingest | Processed raw/python/nestjs-deploy.md

- Created: [[wiki/concepts/nestjs-deployment]]
- Created: [[wiki/concepts/node-env]]
- Created: [[wiki/concepts/health-checks]]
- Created: [[wiki/concepts/logging]]
- Created: [[wiki/concepts/scaling]]
- Updated: index.md
- Notes: No existing wiki pages related to NestJS/deployment, so all pages are new. Source is incomplete (scaling section cuts off), recorded as uncertainty in [[wiki/concepts/scaling]].

## [2026-09-23] ingest | Processed raw/database/postgres/Postgres Notification.md

- Created: [[wiki/concepts/postgres-listen-notify]]
- Created: [[wiki/concepts/notify-transactions]]
- Created: [[wiki/concepts/notify-queue]]
- Updated: index.md
- Notes: First database-related pages in the wiki; no existing pages to update. The file was empty on the first /ingest attempt earlier today and had content on the second.

## [2026-09-23] ingest | Processed raw/topics/latitude-longitude.md

- Created: [[wiki/concepts/latitude-longitude]]
- Updated: index.md
- Notes: The raw file is a task spec (not source prose) that requested web-search Wikipedia links; performed the search and cited the official articles (Latitude, Longitude, Geographic coordinate system). API field-order remark (GeoJSON lon-first) marked as general knowledge.

## [2026-09-23] ingest | Processed raw/database/neon/postgres/Real-Time Notifications using pg_notify with Lakebase Postgres.md

- Created: [[wiki/concepts/trigger-based-notify]]
- Updated: [[wiki/concepts/postgres-listen-notify]] - linked to the new trigger pattern page
- Updated: index.md
- Notes: Practical companion to the earlier pg_notify doc. Neon specifics (direct connection, Scale to Zero session persistence) recorded vendor-specific. Channel-name inconsistency in the guide (my_channel vs channel_name) preserved as uncertainty.

## [2026-09-23] ingest | Processed raw/jarvis/

- Created: [[wiki/concepts/nx-monorepo]] - Nx workspace architecture for managing multiple projects
- Created: [[wiki/concepts/bounded-contexts]] - Domain-driven design boundaries in monorepos
- Created: [[wiki/concepts/module-boundaries]] - ESLint dependency rules for Nx projects
- Created: [[wiki/concepts/trpc]] - End-to-end type-safe RPC framework
- Created: [[wiki/concepts/drizzle-orm]] - TypeScript ORM for SQL databases
- Updated: index.md - reorganized by topic sections (Architecture & Monorepos, Web & Data, Deployment & Operations, Database & Events, Fundamentals)
- Linked: All new pages cross-reference each other via [[wiki/concepts/*]]
- Notes: Jarvis is a monorepo for a Model Catalog (detecting objects via models). Key architecture: Nx workspace with one bounded context (model-catalog) containing web (React), bff (Hono+tRPC), and contract (Zod). Shared libs: db (Drizzle), ui, logging. No existing wiki pages related to monorepo architecture or these frameworks.

## [2026-09-23] lint | Wiki health check

- Created: none
- Updated: log.md
- Linked: none
- Notes: 24 pages, 24 index entries, 0 broken wiki links, 0 orphan pages, 0 missing raw sources. Issues found: missing Example sections on notify-queue and notify-transactions; nonstandard Example heading on trigger-based-notify; latitude-longitude Related Concepts has no wiki links; empty Untitled.md at root; raw/docs/nx.md, raw/docs/tsconfig.md, raw/jarvis/tsconfig.md not referenced by any page. No large fixes applied.

## [2026-09-23] create | Jarvis explanation page

- Created: [[wiki/concepts/jarvis]] - Overview of the Model Catalog monorepo project
- Updated: index.md - Added "Projects" section with Jarvis link
- Linked: Cross-references to nx-monorepo, bounded-contexts, module-boundaries, trpc, drizzle-orm, logging
- Notes: Jarvis is a full-stack TypeScript monorepo for managing AI model training and detection. Key components: Model Catalog app (web + bff), shared libraries (db, ui, logging), external integrations (Picasso for tagging classes, Task Manager for training missions). Page includes architecture overview, technology stack, example workflow, and project structure.
