# NOTIFY & Transaction Timing

## Definition
Notification events are not delivered immediately — they are only delivered around transaction boundaries, on both the sending and the receiving side.

## Mental Model
Letters that pile up in an outbox. The postman neither takes a letter from an open writing session, nor delivers mail to someone mid-meeting: everything is swapped when the meeting (transaction) ends — successfully or not.

## Details
- A `NOTIFY` executed inside a transaction is only delivered when the transaction **commits**. If it aborts, the notification never exists — consistent with all other aborted commands.
- If a listening session is inside a transaction when the event arrives, it is not delivered to the client until just after that transaction completes (committed **or** aborted). The server cannot "take back" a notification once sent.
- Upshot: applications using NOTIFY for real-time signaling should keep transactions short.
- **Deduplication:** several NOTIFYs of the same channel with identical payloads within one transaction collapse into a single delivered event.
- **Ordering:** distinct payloads stay distinct; notifications from different transactions are never folded; events from the same transaction arrive in sent order, and events from different transactions arrive in commit order.
- A transaction that executed NOTIFY cannot be prepared for two-phase commit.

## Example

```sql
-- Delivery waits for COMMIT
BEGIN;
NOTIFY jobs, 'done';   -- nothing delivered yet
COMMIT;                -- listeners receive it here

-- An aborted transaction produces no notification at all
BEGIN;
NOTIFY jobs, 'done';
ROLLBACK;              -- listeners receive nothing

-- Identical payloads in one transaction collapse into one event
BEGIN;
NOTIFY jobs, 'done';
NOTIFY jobs, 'done';   -- duplicate, dropped
NOTIFY jobs, 'other';  -- distinct payload, kept
COMMIT;                -- two events delivered, in sent order
```

## Related Concepts
- [[postgres-listen-notify]]
- [[notify-queue]]
- [[trigger-based-notify]] — Triggers fire inside the transaction described here

## Sources
- [[raw/database/postgres/Postgres Notification.md]]