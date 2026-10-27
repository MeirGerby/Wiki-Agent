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
- [[wiki/concepts/nx-common-commands]] — Day-to-day Nx commands organized by use case
- [[wiki/concepts/bounded-contexts]] — Domain-driven design boundaries in a monorepo
- [[wiki/concepts/module-boundaries]] — ESLint dependency rules in Nx projects
- [[wiki/concepts/typescript-project-references]] — Composite builds and the tsconfig hierarchy

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

### Issue Tracking & Operations

- [[wiki/concepts/linear-issue-tracker]] — Linear MCP operations, workflow statuses, triage labels
- [[wiki/concepts/jarvis-development-guidelines]] — Development conventions (Nx patterns, comments, language, module boundaries)

### Database & Events

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

### Git, GitHub & SSH

- [[wiki/concepts/git-patches]] — Moving commits between machines with format-patch and am
- [[wiki/concepts/git-undo-and-recovery]] — restore, reset, revert, clean and the reflog
- [[wiki/concepts/git-history-rewriting]] — rebase, cherry-pick, amend, filter-repo
- [[wiki/concepts/ssh-keys-and-agent]] — Key pairs, authorized_keys and ssh-agent
- [[wiki/concepts/ssh-tunnels]] — Port forwarding and jump hosts
- [[wiki/concepts/github-multi-account-auth]] — gh auth switch vs SSH host aliases

### Linux Cyber Path

- [[wiki/concepts/cyber-learning-path]] — 20-step path from Linux basics to a security assessment (with step map)
- [[wiki/concepts/linux-filesystem-navigation]] — Directory tree, ls/cd/find/stat
- [[wiki/concepts/bash-scripting]] — Variables, conditions, loops, exit codes, safe scripts
- [[wiki/concepts/kali-tools]] — Nmap, Wireshark, Burp Suite: when to use which
- [[wiki/concepts/linux-permissions]] — Owners, groups, mode bits and sudo
- [[wiki/concepts/linux-processes-services]] — Processes, systemd services and their logs
- [[wiki/concepts/network-fundamentals]] — IP, DNS, TCP/UDP and Linux network tools
- [[wiki/concepts/packet-capture]] — tcpdump and Wireshark
- [[wiki/concepts/network-scanning]] — Nmap: hosts, ports, services
- [[wiki/concepts/log-investigation]] — Finding patterns in auth and system logs
- [[wiki/concepts/linux-firewall]] — ufw/nftables and least privilege
- [[wiki/concepts/system-hardening]] — Reducing attack surface, hardening checklist
- [[wiki/concepts/persistence-mechanisms]] — Where programs survive a reboot
- [[wiki/concepts/suid-and-capabilities]] — Special permissions and privilege-escalation surface
- [[wiki/concepts/cyber-lab]] — Isolated VM lab, snapshots, Kali tools
- [[wiki/concepts/web-security]] — OWASP Top 10, SQL injection, XSS
- [[wiki/concepts/incident-response]] — Preserve, collect, timeline, hash, report
- [[wiki/concepts/security-assessment-report]] — Capstone report: findings, risk, evidence, fixes
- [[wiki/concepts/cyber-command-reference]] — Grouped index of every cyber-path command
- [[wiki/concepts/security-scenarios]] — 10 advanced defensive scenarios
- [[wiki/concepts/suspicious-connections]] — Unexpected listeners and outbound connections
- [[wiki/concepts/web-log-analysis]] — Spotting probing in web access logs
- [[wiki/concepts/rogue-accounts]] — Hidden or unexpected user accounts
- [[wiki/concepts/file-integrity]] — Hashes and package verification
- [[wiki/concepts/mass-file-changes]] — Responding to sudden bulk file changes
- [[wiki/concepts/lateral-movement-review]] — Checking SSH movement between hosts

### English Learning

- [[wiki/concepts/english-learning-path]] — 20-step path with a step-to-page map
- [[wiki/concepts/english-assessment-and-progress]] — Baseline and progress test across four skills
- [[wiki/concepts/english-vocabulary-and-phrases]] — Words by topic, phrases and collocations
- [[wiki/concepts/english-sentence-structure]] — Subject, verb, object and word order
- [[wiki/concepts/english-verb-to-be]] — am, is, are and there is/are
- [[wiki/concepts/english-tenses]] — Present, past, future, perfect and continuous
- [[wiki/concepts/english-questions-and-negation]] — do/does/did and don't/doesn't/didn't
- [[wiki/concepts/english-linking-words]] — because, therefore, although, however, unless
- [[wiki/concepts/english-listening]] — Gist-first listening, three-pass subtitles
- [[wiki/concepts/english-pronunciation]] — Stress, rhythm, shadowing, Hebrew-speaker sounds
- [[wiki/concepts/english-graded-reading]] — Reading at the right level, repeated words
- [[wiki/concepts/english-speaking-practice]] — Self-talk, conversation, thinking in English
- [[wiki/concepts/english-daily-writing]] — 5 sentences a day and a mistake log
- [[wiki/concepts/professional-english]] — Linux, programming and cyber vocabulary
- [[wiki/concepts/hebrew-speaker-english-mistakes]] — Recurring errors from Hebrew structure
- [[wiki/concepts/english-daily-routine]] — 40-minute spaced daily routine

## Commands

- [[wiki/commands/grep]] — Search text using patterns
- [[wiki/commands/sed]] — Stream editor
- [[wiki/commands/awk]] — Text processing and pattern scanning
- [[wiki/commands/git]] — Version control: everyday and advanced commands
- [[wiki/commands/gh]] — GitHub CLI: PRs, issues, Actions, releases, API
- [[wiki/commands/ssh]] — Secure remote login, config, keys

## Meta

- [[wiki/concepts/wiki-maintenance]] — Keeping the wiki healthy, preventing decay

## Q&A

Questions paired one-to-one with answers. 8 pairs: 1 asked, 7 generated as
practice material.

- [[qa/index]] — Full Q&A index, grouped by topic
