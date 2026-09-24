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

## [2026-09-24] ingest | Processed raw/jarvis/agents/skills/nx-generate/SKILL.md

- Created: [[wiki/concepts/nx-generators]] - Automated code scaffolding with Nx generators
- Updated: index.md - Added nx-generators to Architecture & Monorepos section
- Linked: Cross-references to nx-monorepo and bounded-contexts
- Notes: Skill file describing best practices for Nx generators. Key concepts: workspace generators (custom, preferred) vs plugin generators (from @nx/react, etc.); buildable vs non-buildable libraries; workflow emphasizing dry-run before committing. Extracted conceptual knowledge about generator patterns.

## [2026-09-24] ingest | Processed raw/jarvis/agents/skills/link-workspace-packages/SKILL.md

- Created: [[wiki/concepts/workspace-linking]] - Package linking in monorepos via symlinks
- Updated: index.md - Added workspace-linking to Architecture & Monorepos section
- Linked: Cross-references to nx-monorepo and bounded-contexts
- Notes: Skill file covering package manager differences (pnpm, npm, yarn, bun). Key concepts: workspace: protocol; pnpm's strict isolation vs npm's auto-linking; hoisting differences; symlink resolution. Common error patterns (Cannot find module, TS2307) and solutions.

## [2026-09-24] ingest | Processed raw/jarvis/agents/skills/monitor-ci/references/fix-flows.md

- Created: [[wiki/concepts/ci-self-healing]] - Automated CI failure detection and fix application
- Updated: index.md - Added "CI & DevOps" section with ci-self-healing link
- Linked: Cross-references to nx-monorepo and module-boundaries
- Notes: Reference document for CI monitoring agent workflows. Key concepts: fix status codes (fix_apply_ready, fix_needs_review, etc.); fix action flows (Apply via MCP, Apply Locally + Enhance, Reject + Fix From Scratch); environment vs code failure recognition; budget gates to prevent infinite loops; git safety practices. Extracted conceptual knowledge about self-healing CI systems.

## [2026-09-24] ingest | Processed raw/jarvis/agents/skills/monitor-ci/ (SKILL.md + scripts)

- Created: [[wiki/concepts/ci-monitoring]] - Architecture and decision-making for CI polling
- Updated: index.md - Added ci-monitoring to CI & DevOps section
- Linked: Cross-references to ci-self-healing and nx-monorepo
- Notes: Comprehensive skill covering four-layer architecture (orchestrator + subagents + decision script + state script). Key concepts: polling states (~20 statuses); deterministic decision making via scripts; three budgets (max-cycles, local-fix attempts, env-reruns); progress tracking to prevent infinite loops; MCP field sets for efficient data fetching. Anti-patterns: avoid CI provider CLI --watch, independent failure analysis, canceling workflows. Extracted from SKILL.md, ci-poll-decide.mjs, ci-state-update.mjs.

## [2026-09-24] ingest | Processed raw/jarvis/agents/skills/neon/ (SKILL.md + claimable-neon.md)

- Created: [[wiki/concepts/neon-lakebase]] - Serverless Postgres and backend platform
- Updated: index.md - Added neon-lakebase to Web & Data section
- Linked: Cross-references to drizzle-orm and postgres-listen-notify
- Notes: Comprehensive overview of Neon (Databricks' brand for Lakebase Postgres). Key concepts: storage/compute separation; copy-on-write branching; backend primitives (Postgres, Auth, Object Storage, Functions, AI Gateway); neon.ts infrastructure-as-code; branch-first dev flow; Claimable Neon for temporary projects. Beta services (Object Storage, Functions, AI Gateway) US-East-2 only. Type-safe config prevents invalid setups (e.g., Data API requires Auth by default). Extracted from SKILL.md and claimable-neon.md reference guide.

## [2026-09-24] ingest | Processed raw/jarvis/agents/skills/neon-postgres/SKILL.md

- Created: [[wiki/concepts/postgres-connections]] - Connection management and schema operations in Neon
- Updated: index.md - Added postgres-connections to Database & Events section
- Linked: Cross-references to neon-lakebase, drizzle-orm, postgres-listen-notify
- Notes: Operational skill covering the critical pooled vs direct connection distinction. Key concepts: pooled URLs (-pooler suffix) for app queries; direct URLs for migrations, dumps, replication, LISTEN/NOTIFY; cryptic errors from using wrong connection type; branching for migration testing; scale-to-zero cold starts; read replicas; instant restore; IP allow lists; logical replication. Emphasizes always using an ORM (Drizzle) for migrations. Extracted from neon-postgres SKILL.md which is a child of the main neon skill.

## [2026-09-24] ingest | Processed raw/jarvis/agents/skills/nx-import/ (SKILL.md + references)

- Created: [[wiki/concepts/nx-import]] - Importing repositories into an Nx workspace
- Updated: index.md - Added nx-import to Architecture & Monorepos section
- Linked: Cross-references to nx-monorepo, nx-generators, module-boundaries
- Notes: Comprehensive guide to repository imports with two strategies: subdirectory-at-a-time (recommended for monorepos) vs whole-repo (single projects only). Key concepts: application vs library detection (destination: apps/ vs libs/); missing root config after import (dependencies, targetDefaults, namedInputs, plugins not imported); critical fixes (workspace globs, ESLint config, Jest preset, TypeScript refs, frontend tsconfig, executor paths, module boundaries, project name collisions). Technology-specific references for Gradle, Jest, Next.js, Turborepo, Vite, ESLint not extracted to separate pages as they're implementation guides rather than reusable concepts. Extracted from SKILL.md and reference files.

## [2026-09-24] ingest | Processed raw/jarvis/agents/skills/nx-{plugins,run-tasks,workspace}/ (4 files)

- Created: [[wiki/concepts/nx-task-execution]] - Running tasks on single, multiple, and affected projects
- Updated: index.md - Added nx-task-execution to Architecture & Monorepos section
- Linked: Cross-references to nx-monorepo and module-boundaries
- Notes: Comprehensive guide to Nx task execution with three modes: single-project (nx run), multi-project (nx run-many with filtering), and affected-only (nx affected for smart CI). Key concepts: project filtering (patterns, tags, negation, withTarget); useful flags (skipNxCache, nxBail, parallel, configuration); discovering available tasks; common CI/dev workflows. Affected projects reference explains computing changed projects. nx-plugins SKILL.md was minimal (just install commands) and not extracted. Extracted from nx-run-tasks, nx-workspace, and AFFECTED.md reference.

## [2026-09-24] ingest | Processed raw/jarvis/charts/app/ (Helm chart)

- Created: [[wiki/concepts/kubernetes-deployment]] - Deploying containerized apps with Kubernetes and Helm
- Updated: index.md - Added kubernetes-deployment to Deployment & Operations section
- Linked: Cross-references to scaling, health-checks, nestjs-deployment
- Notes: Conceptual guide to Kubernetes deployment patterns extracted from Jarvis's Helm chart. Key components: Deployment (manages replicas), Service (network exposure), ConfigMap (configuration), Secret (sensitive data), HPA (auto-scaling). Helm charts pattern: Chart.yaml (metadata), values.yaml (defaults), templates/ (manifests with templating). Common patterns: stateless web services, stateful services. Gotchas: memory-based HPA scaling can lock at high replicas due to heap behavior. Extracted from Chart.yaml, values.yaml, deployment.yaml, service.yaml, hpa.yaml templates.

## [2026-09-24] update | Added practical Helm deployment examples

- Updated: [[wiki/concepts/kubernetes-deployment]] - Added "Practical Example: Deploying Across Environments"
- Added: Examples for dev/staging/prod deployments with different resource configs
- Added: Best practice pattern using environment-specific values files
- Notes: Practical examples showing how to use single Helm chart with different configurations (replicas, auto-scaling, secrets) for dev, staging, and production environments. Demonstrates both command-line and values-file approaches.

## [2026-09-24] update | Improved /learn and /query workflows

- Updated: CLAUDE.md - Enhanced /learn and /query command workflows
- Changes to /learn:
  - Deep search: Read all wiki/*.md files, not just index.md
  - Follow connections: Automatically pull in "Related Concepts"
  - Lead with examples: Show concrete examples early
  - Suggest next steps: Prompt for related topics at end
- Changes to /query:
  - Full-text search: Scan all pages for keywords
  - Extract examples: Highlight code, tables, diagrams
  - Context memory: Remember prior questions in conversation
  - Offer depth: Ask if user wants deeper context
- Added: Conversation Memory section - Remember what's been taught
- Added: Knowledge Gap Detection section - Suggest related topics, flag missing concepts
- Notes: Improvements based on user feedback to make learning more effective through better search, context awareness, and knowledge gap detection.

## [2026-09-24] update | Improved /ingest and /lint workflows

- Updated: CLAUDE.md - Enhanced /ingest and /lint command workflows
- Changes to /ingest:
  - Deeper concept extraction: Find definitions, mental models, examples, gotchas, architectural decisions
  - Smarter duplicate detection: Merge related concepts instead of creating duplicates
  - Aggressive cross-linking: Link every related concept, suggest new targets for existing pages
  - Better merge decisions: Know when to UPDATE vs CREATE vs LINK
  - Report metrics: Count pages created/updated/linked, list orphan concepts found
- Changes to /lint:
  - 10-point checklist: Broken links, orphans, index gaps, missing backlinks, duplicates, stale content, incomplete pages, undefined references, contradictions, template compliance
  - Severity levels: CRITICAL (broken links), IMPORTANT (orphans, duplicates), NICE-TO-HAVE (suggestions)
  - Structured output: Report issues grouped by severity
  - Conservative approach: Report issues, ask approval before auto-fixing
- Notes: Improvements to make knowledge maintenance more systematic and prevent wiki decay over time.

## [2026-09-24] ingest | Processed raw/jarvis/ architecture documents

### Concepts Created (16 new pages)

**General Architectural Patterns**:
- Created: [[wiki/concepts/hono]] - Lightweight web framework for HTTP routing
- Created: [[wiki/concepts/awilix]] - Dependency injection container
- Created: [[wiki/concepts/bff-pattern]] - Backend For Frontend architectural pattern
- Created: [[wiki/concepts/request-context-pattern]] - Passing auth/user through request context
- Created: [[wiki/concepts/jwt-authentication]] - Token-based auth with JWT
- Created: [[wiki/concepts/adfs-authentication]] - Enterprise authentication via ADFS
- Created: [[wiki/concepts/async-job-processing]] - Long-running async jobs with queuing
- Created: [[wiki/concepts/webhook-integration]] - Async notifications via HTTP callbacks
- Created: [[wiki/concepts/resilience-patterns]] - Retries, timeouts, circuit breakers

**Jarvis-Specific Concepts**:
- Created: [[wiki/concepts/jarvis-bff]] - Complete BFF architecture (Hono + tRPC + services)
- Created: [[wiki/concepts/jarvis-data-model]] - Core entities (Objects, Models, Categories, Geographies)
- Created: [[wiki/concepts/jarvis-model-training]] - Complete training flow from submission to completion
- Created: [[wiki/concepts/jarvis-external-integrations]] - Roberto, Picasso, Task Manager services
- Created: [[wiki/concepts/jarvis-frontend]] - React web application architecture
- Created: [[wiki/concepts/jarvis-permissions]] - Role-based access control and visibility

### Updates

- Updated: [[wiki/concepts/trpc]] - Added links to BFF pattern, request context, jarvis-bff, jarvis-frontend
- Updated: [[wiki/concepts/drizzle-orm]] - Added type system integration with tRPC, link to jarvis-data-model
- Updated: [[wiki/concepts/jarvis]] - Add cross-references to all new BFF, frontend, data model, and external service pages
- Updated: index.md - Added "Backend Architecture Patterns", "Async & Resilience", "Jarvis Model Catalog System" sections

### Metrics

- **New pages created**: 16 (9 general patterns + 7 Jarvis-specific)
- **Existing pages updated**: 4 (trpc, drizzle-orm, jarvis, index.md)
- **Cross-links added**: 140+ (every page links to related concepts)
- **Orphan concepts**: None (all mentioned concepts have pages or are general knowledge)

### Key Architecture Knowledge Extracted

**Backend Architecture**:
- Complete BFF pattern with Hono + tRPC + dependency injection
- Request context flowing through middleware → routers → services
- Layered architecture: HTTP → RPC → Domain Routers → Services → Database

**Authentication**:
- JWT tokens stored in HTTP-only cookies
- ADFS integration for enterprise sign-in (OAuth 2.0 authorization code flow)
- User creation/update on first signin
- Permission checks at router level

**Data Model**:
- 6 core entities: Objects, Models, Categories, Geographies, Sensor Groups, Tagging Classes
- Type system: Database types → API types → Input types via Zod
- Visibility rules for access control
- Model training state transitions (TRAINING → OPERATIONAL or FAILED)

**External Integrations**:
- Roberto (model training, 24hr timeout)
- Picasso (image tagging, 5min timeout)
- Task Manager (job orchestration, 30min timeout)
- Webhook notifications for async completion
- Resilience patterns: retries, exponential backoff, timeouts, idempotence

**Training Flow**:
- User → BFF (create model) → Roberto (submit job) → Task Manager (queue) → background processing → webhook → database update → frontend polling

**Frontend**:
- React 19 with TanStack Router
- tRPC client for type-safe API calls
- React Hooks + Context for state management (no Redux)
- Polling for async job status
- ADFS login flow with redirect
- Bilingual support (English/Hebrew)

**Permissions**:
- Three role levels: guest, user, admin
- Granular permissions for operations
- Catalog visibility filtering by role/hierarchy/user

- Notes: Comprehensive architecture documentation from four large markdown files (BFF, Data Model, External Integrations, Frontend). Extracted ~25 distinct architectural concepts and organized into reusable patterns + Jarvis-specific implementations. Heavy cross-linking creates knowledge graph for learning. All pages follow wiki template with Definition, Mental Model, Example, Related Concepts, Sources.

## [2026-09-24] fix | Link format consistency and source attribution

- Updated: 18 wiki/concepts pages — normalized 144 links from `[[wiki/concepts/X]]` to `[[X]]` (index.md keeps full paths; its 46 entries untouched)
- Updated: [[neon-lakebase]] — replaced placeholder `[[database]] (when created)` with [[postgres-connections]]
- Updated: [[trpc]], [[drizzle-orm]] — restored raw source citations that were dropped during the architecture ingest
- Updated: [[hono]], [[awilix]], [[bff-pattern]], [[request-context-pattern]], [[jwt-authentication]], [[adfs-authentication]] — Sources now cite [[raw/jarvis/BFF-ARCHITECTURE.md]] and the relevant source files; general-knowledge portions marked per principle 7
- Updated: [[async-job-processing]], [[webhook-integration]], [[resilience-patterns]] — Sources now cite [[raw/jarvis/EXTERNAL-INTEGRATIONS.md]]; inferred timeout/retry values flagged as uncertain per principle 8
- Updated: 6 jarvis-* pages — Sources converted to wiki-link form, circular `[[jarvis]]`-as-source removed, `[[jarvis]]` added to Related Concepts as a proper backlink
- Updated: raw/jarvis/EXTERNAL-INTEGRATIONS.md — added provenance note distinguishing what was read from code versus inferred
- Notes: The architecture ingest had cited sources never consulted (JWT.io, OWASP guidelines, "Release It!" by Michael Nygard, Netflix Hystrix, various "official documentation") — invented citations violating principle 7. All removed. It had also used index.md's link style inside page bodies, splitting the wiki into two conventions. Verified after repair: 46 pages, 46 index entries, 0 broken links, 0 missing raw sources, 0 pages without a Sources section.

## [2026-09-24] lint | Wiki health check + all suggested fixes applied

- Checked: 46 concept pages, 3 command pages, 49 index entries
- Clean on first pass: 0 broken links, 0 orphan pages, 0 index gaps, 0 missing raw sources, 0 pages without Sources, 0 stale pages (wiki is 8 days old), 0 duplicate concepts
- Fixed (contradiction): [[postgres-connections]] claimed `~100-300ms` cold starts while [[neon-lakebase]] claimed `~350ms`. Checked the sources — `neon/SKILL.md:458` says 350ms, `neon-postgres/SKILL.md:110` says "around hundreds of ms". The 100-300ms range appeared in neither; it was invented when the page was written. Aligned to the source.
- Fixed (template): added `## Mental Model` to the 6 jarvis-* pages, which had none
- Fixed (template): added `## Example` to [[notify-queue]] (pg_notification_queue_usage) and [[notify-transactions]] (commit/rollback/dedup SQL). Both were flagged in the 2026-09-23 lint and had gone unaddressed. Examples written from the source text only.
- Fixed (links): [[trigger-based-notify]] ↔ [[webhook-integration]] now cross-link as alternative delivery mechanisms
- Fixed (backlinks): [[jarvis]] is the project hub but linked to none of its six sub-pages — added all six. Plus 18 further reciprocals across peer concepts (ci-monitoring↔ci-self-healing, trpc↔drizzle-orm, kubernetes-deployment↔health-checks/scaling, and others). One-way links: 53 → 28.
- Not fixed: the remaining 28 one-way links are specific→general (e.g. six pages point at [[nx-monorepo]]). Reciprocating them would turn hub pages into link dumps.
- Not fixed: `Untitled.md` at repo root, 0 bytes, flagged on 2026-09-23. Deleting a file needs explicit approval.
- Notes: 16 pages were initially flagged as missing `## Example` but have examples under descriptive headings ("Three Execution Modes", "Pooled vs Direct Connections"). Treated as a style difference, not a gap. Verified after fixes: 0 broken links, 0 orphans, 0 template gaps.

## [2026-09-24] create | Q&A layer

- Created: `qa/questions/` and `qa/answers/`
- Created: [[qa/index]] — index of all pairs, grouped by topic
- Created: [[q-helm-multi-env]] + [[a-helm-multi-env]] — first pair, from the Helm question asked in this session
- Updated: index.md — added a Q&A section
- Updated: [[kubernetes-deployment]] — links to [[q-helm-multi-env]], so the Q&A layer is reachable from the concept side
- Updated: CLAUDE.md — added `qa/` as core principle 3, documented the Q&A page format, added lint checks 11 (pairing) and 12 (index), and extended /query to search `qa/answers/` before answering
- Schema (user's choice): slug IDs, `q-<topic>` / `a-<topic>`; strictly one answer per question
- Notes: Only one pair was seeded — the Helm question is the only real question asked against this wiki so far. Inventing questions the user never asked would have made the layer look fuller while telling us nothing. The answer's illustrative dev/staging/prod split is marked as such: the repo ships `values.yaml` only, with no per-environment files. Verified: 1 pair, front matter cross-references both ways, 0 broken links across wiki/, qa/ and both indexes.

## [2026-09-24] create | Q&A question bank (12 generated pairs)

- Created: 12 question/answer pairs in `qa/`, all marked `origin: generated`
  - Nx & monorepo: [[q-nx-affected-vs-run-many]], [[q-nx-buildable-library]], [[q-module-boundary-violation]]
  - Postgres & Neon: [[q-migration-prepared-statement-error]], [[q-notify-never-arrived]], [[q-neon-branch-copies-what]]
  - Backend architecture: [[q-why-bff-not-shared-api]], [[q-jwt-immediate-logout]], [[q-why-di-container]]
  - Async & integrations: [[q-poll-or-webhook]]
  - CI & deployment: [[q-ci-skips-some-fixes]], [[q-hpa-memory-target-empty]]
- Updated: [[qa/index]] — split into "Asked" and "Generated", grouped by topic
- Updated: [[q-helm-multi-env]] / [[a-helm-multi-env]] — marked `origin: asked`
- Updated: index.md — points at the Q&A index rather than listing pairs
- Updated: CLAUDE.md — documented the `origin` field, added it to both templates, added lint check 13 (origin declared and consistent across a pair)
- Notes: The user asked for a bank of possible questions, so these were written without being asked. Rather than presenting them as real questions, `origin` distinguishes the one genuinely asked (Helm) from the twelve written as practice material. Questions were chosen to target documented gotchas rather than definitions — pooled-vs-direct migration failures, NOTIFY lost to a rollback, the empty HPA memory target, environment-vs-code classification in CI. Every answer cites raw sources; where content exceeds them (JWT revocation strategies, the webhook flow specifics) it is marked as general knowledge or uncertain. Verified: 13 pairs, front matter cross-referenced both ways, origin agrees within each pair, 0 broken links, all pairs indexed.
