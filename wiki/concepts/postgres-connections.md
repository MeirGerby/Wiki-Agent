# Postgres Connections & Schema Management

## Definition

In serverless and cloud-hosted Postgres (especially Neon), managing connections correctly is critical. Neon provides two connection types—pooled (for application queries) and direct (for schema operations)—with different guarantees. Using the wrong one causes silent failures that don't name pooling.

## Mental Model

Think of a hotel front desk. The pooled connection is a receptionist who hands you off between floors (requests), perfect for quick check-ins (web requests). The direct connection is a dedicated elevator to your room, necessary when you need to unpack and stay for a while (schema migrations, backups). If you use the receptionist for unpacking, they'll cut you off when the next guest arrives.

## Pooled vs Direct Connections

| Use Case | Type | Why |
|----------|------|-----|
| **Web app queries** | Pooled (`-pooler`) | Bursty traffic, request-per-connection workloads |
| **Serverless functions** | Pooled (`-pooler`) | Cold starts, brief execution windows |
| **Schema migrations** | Direct (no `-pooler`) | Requires `SET` commands, transaction state |
| **pg_dump / pg_restore** | Direct | Long-running, session state needed |
| **Logical replication** | Direct | Replication slots, session-level operations |
| **LISTEN / NOTIFY** | Direct | Subscription state must persist |
| **Analytics with temp tables** | Direct | Temporary object scope is session-bound |

**Neon provides two URLs**:
- `DATABASE_URL` — pooled (via PgBouncer, transaction mode)
- `DATABASE_URL_UNPOOLED` — direct (raw connection)

## Pooling Gotchas

Using the pooled URL for migrations causes cryptic errors that never name pooling:

```
Prisma: "prepared statement 's0' already exists"
Drizzle: "SET search_path" doesn't persist, next query: "relation 'table' does not exist"
Direct queries: "SQLSTATE 25006" (write to read-only transaction — inherited from previous client)
```

**Fix**: Migration tools accept both URLs simultaneously. Point `directUrl` (or equivalent) at the direct URL:

```typescript
// Prisma
DATABASE_URL="postgres://....-pooler..."
DATABASE_URL_DIRECT="postgres://......."  // renamed to directUrl by Prisma

// Drizzle (in schema file)
// Use DATABASE_URL_UNPOOLED for drizzle-kit generate/migrate
```

## Schema Migrations

**Always use an ORM** (Drizzle, Prisma) for schema and migrations. Avoid ad hoc SQL against production.

**Testing workflow**:
1. Create a branch from production data: `neon branch create --parent main`
2. Run migration on the branch with the direct URL
3. Test the migration against production-like data
4. Apply to production once validated

**Direct connection is required** — migration tools use session state that pooling breaks.

## Branching for Testing

Branches are instant, copy-on-write clones:

```bash
neon branch create dev-new-schema --parent main
neon branch restore <branch> --snapshot <timestamp>  # Point-in-time restore
neon diff <branch> main                               # Compare schemas
```

Each branch has its own compute endpoint and connection strings (both pooled and direct).

## Connection Pooling Details

- **PgBouncer in transaction mode** — connections are returned to the pool after each transaction
- **Session state is lost** — `SET` commands, temporary objects, prepared statements don't carry over
- The `-pooler` suffix in the hostname routes to PgBouncer

Pooled connections are essential for serverless (request-per-connection) but insufficient for operations that need session scope.

## Scaling Features

| Feature | Use For |
|---------|---------|
| **Autoscaling** | Auto-size compute CUs with workload (min/max bounds) |
| **Scale-to-Zero** | Suspend idle compute (default 5 min); first query after suspend pays a cold start (~350ms) |
| **Instant Restore** | Create branches from any point in history (plan-dependent window) |
| **Read Replicas** | Dedicated read-only compute, independent scaling, shared storage |

Scale-to-zero saves cost but adds cold-start latency. Replica queries don't compete with write workload.

## Related Concepts

- [[neon-lakebase]] — Overview of Neon and Lakebase Postgres
- [[drizzle-orm]] — ORM for schema management and migrations
- [[postgres-listen-notify]] — LISTEN/NOTIFY (requires direct connection)

## Sources

- [[raw/jarvis/agents/skills/neon-postgres/SKILL.md]]
