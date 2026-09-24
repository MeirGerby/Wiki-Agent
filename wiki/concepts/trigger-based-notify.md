# Trigger-Based Notify (Real-Time Notifications)

## Definition
A pattern for real-time notifications in Postgres: a trigger function calls `pg_notify` on every insert (or other operation) into a table, and subscribed application clients receive the payload — a database-driven, webhook-like way to notify users or invoke external services when data changes.

## Mental Model
The table is a doorbell wired directly to the door. Nobody has to remember to press it — the door (a trigger on `AFTER INSERT`) rings automatically on every change, and only people who subscribed (LISTEN) hear it. The application code that writes data stays ignorant of notifications.

## Example (Node.js + `pg`)

```js
// setup.js — create table, trigger function, and trigger
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

CREATE OR REPLACE FUNCTION my_trigger_function() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('channel_name', NEW.message);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER my_trigger AFTER INSERT ON my_table
  FOR EACH ROW EXECUTE FUNCTION my_trigger_function();
```

```js
// listen.js — subscribe and react
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
client.on('notification', (msg) => console.log('Notification received', msg.payload));
await client.query('LISTEN channel_name');
```

```js
// send.js — ordinary INSERT performs the rest
await client.query('INSERT INTO my_table (message) VALUES ($1)', ['Hello, world!']);
```

Run order: `node setup.js` → `node listen.js` → `node send.js`.

## Notes & Uncertainties
- The trigger fires inside the INSERT's transaction, so the notification is delivered only when that transaction commits (see [[notify-transactions]]).
- **Neon connection string format**: `postgres://<user>:<password>@<endpoint_hostname>.neon.tech:<port>/<dbname>` — default port 5432, default database `neondb`, optional `?sslmode=require&channel_binding=require` for enforced SSL. The guide instructs using a *direct* (non-pooled) connection (uncheck "Pooled connection" in the console).
- **Neon Scale to Zero caveat (vendor-specific, from the guide):** Neon ends running sessions after ~5 minutes of inactivity, and NOTIFY/LISTEN persists only for the current session. Listeners are therefore dropped on session end, which can cause missed messages; persistent listeners require disabling Scale to Zero.
- The guide text is inconsistent about the channel name: prose says `my_channel`, code uses `channel_name` (also reused for the trigger function name). Preserved as-is rather than silently "fixed".
- The guide's summary describes this as "webhook-like": triggers selectively listen to table changes and invoke `pg_notify` to reach connected listeners.

## Related Concepts

- [[postgres-listen-notify]]
- [[notify-transactions]]
- [[notify-queue]]
- [[webhook-integration]] — HTTP callbacks as the alternative delivery mechanism

## Sources
- [[raw/database/neon/postgres/Real-Time Notifications using pg_notify with Lakebase Postgres.md]]