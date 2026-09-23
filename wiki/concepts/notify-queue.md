# Notification Queue (PostgreSQL)

## Definition
A queue that holds notifications already sent but not yet consumed by all listening sessions; if it fills up, transactions calling NOTIFY fail at commit. In a standard installation it is about 8GB, intended to suffice for almost every use case.

## Mental Model
A warehouse of undelivered broadcast messages. If the warehouse is full, the sender is refused at the door (commit fails). And one stubborn session holding a transaction open can block the cleanup crew until it leaves.

## Notes & Uncertainties
- No cleanup can happen while a session runs `LISTEN` and then stays inside one transaction for a very long time. Once the queue is half full, the log file shows warnings pointing at the session blocking cleanup — that session should end its current transaction so cleanup can proceed. (The source does not say what device the cleanup needs; mechanism left as stated.)
- `pg_notification_queue_usage()` returns the fraction of the queue currently occupied by pending notifications.

## Related Concepts
- [[postgres-listen-notify]]
- [[notify-transactions]]

## Sources
- [[raw/database/postgres/Postgres Notification.md]]