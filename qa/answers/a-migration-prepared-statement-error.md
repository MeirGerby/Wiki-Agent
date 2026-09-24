---
id: a-migration-prepared-statement-error
question: q-migration-prepared-statement-error
concepts:
  - postgres-connections
  - drizzle-orm
  - neon-lakebase
origin: generated
---

# You ran the migration over the pooled connection

## Short answer

Neon's pooled URL routes through PgBouncer in transaction mode, which drops session state between transactions. Migrations need the direct (unpooled) URL.

## The two URLs

`neon env pull` writes both:

| Variable | Host | Use for |
|---|---|---|
| `DATABASE_URL` | has `-pooler` | application queries, serverless |
| `DATABASE_URL_UNPOOLED` | no `-pooler` | migrations, dumps, replication, LISTEN/NOTIFY |

## Why the error never says "pooling"

Transaction-mode pooling returns the backend to the pool after each transaction,
so anything session-scoped vanishes. The symptoms all look like something else:

- `prepared statement "s0" already exists` -- a reused backend still holds it
- `relation "mytable" does not exist` -- your `SET search_path` did not survive
- `SQLSTATE 25006` -- you inherited a read-only transaction from an earlier client

## The fix

Do not swap `DATABASE_URL`, or the application loses pooling. Migration tools take
both at once -- Prisma has `directUrl` alongside `url`; point that at the unpooled
string and leave the pooled one for the app.

Anything needing session scope belongs on the direct URL, including
[[postgres-listen-notify]].

## Sources

- [[raw/jarvis/agents/skills/neon-postgres/SKILL.md]]

## Question

- [[q-migration-prepared-statement-error]]

## Related Concepts

- [[postgres-connections]]
- [[drizzle-orm]]
- [[neon-lakebase]]
