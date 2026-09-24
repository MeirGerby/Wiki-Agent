---
id: a-notify-never-arrived
question: q-notify-never-arrived
concepts:
  - notify-transactions
  - postgres-listen-notify
  - notify-queue
origin: generated
---

# Most likely the transaction never committed

## Short answer

A NOTIFY inside a transaction is delivered on COMMIT. If the transaction rolled back the notification never existed at all -- the same as any other aborted command.

## Delivery happens at transaction boundaries

```sql
BEGIN;
NOTIFY jobs, 'done';   -- nothing delivered yet
ROLLBACK;              -- listener receives nothing, ever
```

Both sides are affected. If the **listening** session is itself inside a
transaction when the event arrives, the client does not see it until that
transaction finishes -- committed or aborted.

## Other reasons a notification looks missing

- **Deduplication.** Identical payloads on the same channel inside one transaction
  collapse into a single event. Distinct payloads are always kept distinct.
- **Pooled connection.** LISTEN is session state; over PgBouncer in transaction
  mode the subscription does not survive. See [[postgres-connections]].

## Practical rule

Keep transactions short when using NOTIFY for real-time signalling. A long-open
listening transaction also blocks cleanup of the [[notify-queue]].

## Sources

- [[raw/database/postgres/Postgres Notification.md]]

## Question

- [[q-notify-never-arrived]]

## Related Concepts

- [[notify-transactions]]
- [[postgres-listen-notify]]
- [[notify-queue]]
