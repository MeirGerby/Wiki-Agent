# PostgreSQL LISTEN/NOTIFY

## Definition
An asynchronous interprocess communication mechanism between client sessions attached to the same PostgreSQL database. One client runs `NOTIFY channel [, payload]`, and every client that previously ran `LISTEN channel` in the same database receives a notification event.

## Mental Model
A radio channel inside the database. The notifier broadcasts on a channel; only subscribers who tuned in (LISTEN) hear it. Anyone running a database command can see the broadcast — "Notifications are visible to all users." Each broadcast carries the channel name, the sending session's server PID, and a payload.

## Example
```sql
-- psql session A (listener):
LISTEN virtual;

-- psql session B (notifier):
NOTIFY virtual, 'This is the payload';

-- session A receives:
Asynchronous notification "virtual" with payload "This is the payload"
        received from server process with PID 8448.
```

## Notes & Uncertainties
- Channels are designer-defined; the common convention is to name a channel after a table (meaning "I changed this table, look at what's new"), but NOTIFY/LISTEN do not enforce any table association.
- Putting `NOTIFY` inside a statement trigger on table updates makes notification automatic, so the programmer cannot forget it.
- The event's information: channel name, notifying session's PID, and payload (empty string when omitted).
- `payload` must be a simple string literal, shorter than 8000 bytes in the default configuration. For binary or large data, put it in a table and send the record key.
- `pg_notify(channel text, payload text)` is easier than the NOTIFY command when channel/payload must be computed — e.g. `SELECT pg_notify('fo' || 'o', 'pay' || 'load')`.
- A client that both NOTIFYs and LISTENs the same channel gets its own event back; compare the event's PID against your own libpq session PID to ignore self-notifications.
- NOTIFY is not part of the SQL standard.

## Related Concepts
- [[notify-transactions]]
- [[notify-queue]]

## Sources
- [[raw/database/postgres/Postgres Notification.md]]