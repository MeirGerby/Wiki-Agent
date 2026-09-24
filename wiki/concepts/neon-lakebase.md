# Neon & Lakebase Postgres

## Definition

**Lakebase Postgres** is a managed Postgres database built on a lakebase architecture: OLTP directly on cloud object storage, with storage decoupled from compute. It scales, branches, and auto-suspends. **Neon** is Databricks' brand and access path for Lakebase Postgres, bundled with Auth, Object Storage, Compute Functions, and an AI Gateway — a complete set of cloud backend primitives for apps and agents.

## Mental Model

Imagine a version-control system for your database. Like git, you can branch data at any point in time, modify a branch freely, and share data with the parent until your changes diverge. The database itself is stored on cloud object storage, so you pay for what you store, not dedicated machines. Compute is separate and auto-scales to zero.

## Architecture Highlights

**Storage ≠ Compute**:
- Data lives on cloud object storage (scales with data size)
- Compute (Postgres nodes) is separate and ephemeral
- Auto-suspends when idle
- ~350ms cold starts
- Can scale to zero

**Copy-on-Write Branching**:
- Create an isolated branch from the current state or any past state within your retention window
- Share data with parent until writes cause divergence
- Deltas are stored independently
- Use for dev, preview, CI, testing without data duplication

## Backend Primitives

| Service | Status | Use For |
|---------|--------|---------|
| **Lakebase Postgres** | Generally available | OLTP, SQL development, schemas |
| **Auth** | Generally available | Users, sessions, OAuth (managed Better Auth) |
| **Object Storage** | Public beta | Files, uploads, images (S3-compatible, branches with DB) |
| **Functions** | Public beta | Long-running serverless (WebSocket, SSE, agents, APIs) |
| **AI Gateway** | Public beta | Unified API for frontier and open-source models |

**Beta note**: Object Storage, Functions, and AI Gateway available in `us-east-2` only.

## Infrastructure as Code: neon.ts

Declare services in TypeScript for type-safe, validated config:

```typescript
import { defineConfig } from '@neon/config/v1';

export default defineConfig({
  auth: true,
  dataApi: true,
  preview: {
    functions: {},
    buckets: { images: { access: 'private' } },
    aiGateway: true,
  },
  branch: (branch) => {
    if (branch.name.startsWith('dev')) {
      return {
        ttl: '7d',
        postgres: {
          computeSettings: {
            autoscalingLimitMinCu: 0.25,
            autoscalingLimitMaxCu: 1,
            suspendTimeout: '5m',
          },
        },
      };
    }
    return {};
  },
});
```

Then deploy with `neon deploy` (alias: `neon config apply`).

## Branch-First Dev Flow

Treat database branches like git branches:

```bash
neon link               # Once: link project to workspace
neon checkout dev-add-search  # Per feature: creates/checks out branch, pulls env
neon diff               # See schema changes from parent
```

`neon checkout` automatically pulls branch's env into `.env`, so your local setup matches the remote branch.

## Claimable Neon

Provision a temporary project without a Neon account, claim it later:

```bash
npm i -g neon@latest
neon claim create --env-pull
```

- Expires in 72 hours
- Claim codes expire in 15 minutes
- Add Auth or Data API with `neon.ts` + `neon deploy`
- Human claims it via browser, then uses `neon auth` and `neon link`

## Architecture Patterns

**Full-stack app on Vercel** — Next.js owns routes, talks directly to Neon services (Postgres, Auth, Object Storage, Functions, AI Gateway).

**Backend-only with Neon Functions** — Client talks directly to Functions (REST APIs). Useful for client-only SPAs (React Router, TanStack Router) or as WebSocket/SSE servers.

**Agent platforms** — Instant provisioning with snapshots let users toggle between code + state checkpoints. See Neon Agent Program for platform pricing.

## Related Concepts

- [[drizzle-orm]] — SQL ORM that works with Lakebase Postgres
- [[postgres-listen-notify]] — Async notifications within Postgres
- [[postgres-connections]] — Pooled vs direct connections on Neon

## Sources

- [[raw/jarvis/agents/skills/neon/SKILL.md]]
- [[raw/jarvis/agents/skills/neon/references/claimable-neon.md]]
