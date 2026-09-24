# Q&A Index

Questions asked against this wiki, and their answers. Each question has exactly
one answer; the two link to each other by ID.

IDs are slugs: a question is `q-<topic>`, its answer is `a-<topic>`. Files live at
`qa/questions/<id>.md` and `qa/answers/<id>.md`.

Front matter carries `origin`:

- **asked** — a real question someone put to this wiki
- **generated** — written as practice material, not asked by anyone

## Asked

- [[q-helm-multi-env]] — How does Helm work in Jarvis, and how do I deploy to more than one environment? → [[a-helm-multi-env]]

## Generated

### Nx & monorepo

- [[q-nx-affected-vs-run-many]] — When should I use `nx affected` instead of `nx run-many`? → [[a-nx-affected-vs-run-many]]
- [[q-nx-buildable-library]] — Should a new library be buildable or non-buildable? → [[a-nx-buildable-library]]
- [[q-module-boundary-violation]] — Why can't my web app import from the bff? → [[a-module-boundary-violation]]

### Postgres & Neon

- [[q-migration-prepared-statement-error]] — My migration failed with `prepared statement "s0" already exists`. Why? → [[a-migration-prepared-statement-error]]
- [[q-notify-never-arrived]] — I ran NOTIFY but the listener never received it. What happened? → [[a-notify-never-arrived]]
- [[q-neon-branch-copies-what]] — What does branching a Neon database actually copy? → [[a-neon-branch-copies-what]]

### Backend architecture

- [[q-why-bff-not-shared-api]] — Why a BFF instead of one shared API for every client? → [[a-why-bff-not-shared-api]]
- [[q-jwt-immediate-logout]] — How do I log a user out immediately when auth is JWT-based? → [[a-jwt-immediate-logout]]
- [[q-why-di-container]] — Why use a DI container instead of importing modules directly? → [[a-why-di-container]]

### Async & integrations

- [[q-poll-or-webhook]] — Should the frontend poll for training status, or wait for a webhook? → [[a-poll-or-webhook]]

### CI & deployment

- [[q-ci-skips-some-fixes]] — Why does the CI agent refuse to attempt a fix for some failures? → [[a-ci-skips-some-fixes]]
- [[q-hpa-memory-target-empty]] — Why is the memory autoscaling target left empty in the chart? → [[a-hpa-memory-target-empty]]
