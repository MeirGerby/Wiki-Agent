# Learning Wiki

## Concepts

### Projects

- [[wiki/concepts/jarvis]] — Model catalog and detection system monorepo

### Shared Libraries

- [[wiki/concepts/jarvis-shared-libs]] — The three `libs/` packages and their conventions
- [[wiki/concepts/conditional-exports]] — Resolving one package to source or to built output
- [[wiki/concepts/shadcn-ui]] — Vendored component library behind `@jarvis/ui`
- [[wiki/concepts/schema-source-of-truth]] — Code-first vs introspected schemas, and drift

### Jarvis Model Catalog System

- [[wiki/concepts/jarvis-bff]] — Backend For Frontend (Hono + tRPC + services)
- [[wiki/concepts/jarvis-data-model]] — Core entities (Objects, Models, Categories, Geographies, etc.)
- [[wiki/concepts/jarvis-model-training]] — Training flow from submission to completion
- [[wiki/concepts/jarvis-external-integrations]] — Roberto, Picasso, Task Manager services
- [[wiki/concepts/jarvis-frontend]] — React web application architecture
- [[wiki/concepts/jarvis-permissions]] — Role-based access control and visibility rules

### Architecture & Monorepos

- [[wiki/concepts/nx-monorepo]] — Nx workspace for managing multiple projects
- [[wiki/concepts/nx-task-execution]] — Running tasks on single, multiple, or affected projects
- [[wiki/concepts/nx-generators]] — Scaffolding code with Nx generators
- [[wiki/concepts/nx-import]] — Importing repositories into an Nx workspace
- [[wiki/concepts/workspace-linking]] — Linking packages in a monorepo with symlinks
- [[wiki/concepts/bounded-contexts]] — Domain-driven design boundaries in a monorepo
- [[wiki/concepts/module-boundaries]] — ESLint dependency rules in Nx projects
- [[wiki/concepts/typescript-project-references]] — Composite builds and the tsconfig hierarchy
- [[wiki/concepts/jarvis-agent-skills]] — Repo-specific configuration for generic agent skills

### Backend Architecture Patterns

- [[wiki/concepts/bff-pattern]] — Backend For Frontend architectural pattern
- [[wiki/concepts/hono]] — Lightweight web framework for HTTP routing
- [[wiki/concepts/awilix]] — Dependency injection container
- [[wiki/concepts/request-context-pattern]] — Passing auth/user through request flow
- [[wiki/concepts/jwt-authentication]] — Token-based authentication with JWT
- [[wiki/concepts/adfs-authentication]] — Enterprise authentication via ADFS

### Async & Resilience

- [[wiki/concepts/async-job-processing]] — Long-running jobs with queuing and polling
- [[wiki/concepts/webhook-integration]] — Async notifications via HTTP callbacks
- [[wiki/concepts/resilience-patterns]] — Retries, timeouts, circuit breakers, graceful degradation

### Web & Data

- [[wiki/concepts/trpc]] — End-to-end type-safe RPC for TypeScript
- [[wiki/concepts/drizzle-orm]] — TypeScript ORM for SQL databases
- [[wiki/concepts/neon-lakebase]] — Serverless Postgres and backend primitives

### Deployment & Operations

- [[wiki/concepts/kubernetes-deployment]] — Deploying containerized apps with Kubernetes and Helm
- [[wiki/concepts/nestjs-deployment]] — Taking a NestJS app to production
- [[wiki/concepts/node-env]] — Environment variable marking production mode
- [[wiki/concepts/health-checks]] — Endpoint verifying the app is alive
- [[wiki/concepts/logging]] — Recording behavior for troubleshooting
- [[wiki/concepts/scaling]] — Vertical vs horizontal capacity growth

### CI & DevOps

- [[wiki/concepts/ci-pipeline]] — Verify, build and deploy stages across GitHub Actions and GitLab CI
- [[wiki/concepts/pipeline-change-rules]] — Path-based gating of jobs in a monorepo pipeline
- [[wiki/concepts/kaniko-builds]] — Building container images without a Docker daemon
- [[wiki/concepts/ci-monitoring]] — Polling CI status and making deterministic decisions
- [[wiki/concepts/ci-self-healing]] — Automated CI failure detection and fix application

### Database & Events

- [[wiki/concepts/postgres-connections]] — Pooled vs direct connections, schema migrations
- [[wiki/concepts/postgres-listen-notify]] — Async pub/sub inside PostgreSQL
- [[wiki/concepts/notify-transactions]] — Delivery timing, dedup & ordering of NOTIFY
- [[wiki/concepts/notify-queue]] — Queue warnings and full-queue failures
- [[wiki/concepts/trigger-based-notify]] — Webhook-like real-time notifications via triggers

### Fundamentals

- [[wiki/concepts/stdin]] — Standard input
- [[wiki/concepts/stdout]] — Standard output
- [[wiki/concepts/stderr]] — Standard error
- [[wiki/concepts/pipes]] — Connecting command output to another command
- [[wiki/concepts/regex]] — Regular expressions
- [[wiki/concepts/recursive-search]] — Traversing directory trees for matches
- [[wiki/concepts/latitude-longitude]] — How angles pinpoint positions on Earth

## Commands

- [[wiki/commands/grep]] — Search text using patterns
- [[wiki/commands/sed]] — Stream editor
- [[wiki/commands/awk]] — Text processing and pattern scanning

## Meta

- [[wiki/concepts/wiki-maintenance]] — Keeping the wiki healthy, preventing decay

## Q&A

Questions paired one-to-one with answers. 13 pairs: 1 asked, 12 generated as
practice material.

- [[qa/index]] — Full Q&A index, grouped by topic
