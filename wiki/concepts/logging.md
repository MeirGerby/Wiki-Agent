# Logging & Observability

## Definition

Recording what an application did, in a form that can be searched and correlated
after the fact. In practice this means emitting **structured** records — objects
with named fields — rather than prose, so a log aggregator can filter and join them.

## Mental Model

A ship's logbook plus shore-based radio. Local entries tell you what happened on
board; sending them to a central station means the whole fleet's incidents can be
correlated in one place.

The structured part is what makes the shore station useful. `"user 42 failed login
from 10.0.0.1"` is readable but only greppable. `{ event: 'login_failed', userId:
42, ip: '10.0.0.1' }` can be counted, grouped and alerted on. Same information, one
of them queryable.

## The general picture

A NestJS app starts with the built-in logger; the source names Elasticsearch,
Loggly and Datadog as centralized options once an application is distributed enough
that reading one machine's output stops being enough. See [[nestjs-deployment]].

## Structured logging in Jarvis

`@jarvis/logging` is about 110 lines covering three things.

### 1. A wire schema shared by frontend and backend

```ts
export const logSchema = z.looseObject({
  level: z.enum(LogLevel),      // info | warn | error | debug
  project: z.enum(Project),     // model-catalog-web | model-catalog-bff
  event: z.string(),
  message: z.string(),
  ts: z.string(),
  error: z.unknown().optional(),
});

export const logBatchSchema = z.array(logSchema);
export const SESSION_ID_HEADER = 'x-session-id';
```

Three details tell the whole story:

**`Project` includes the web app.** A browser has no log file, so frontend logs have
to travel somewhere. `logBatchSchema` being an *array* says they travel in batches
rather than one request per line.

**`SESSION_ID_HEADER`** is the join key. Tag the browser's batch and the backend's
own lines with the same session id, and one user's journey can be reconstructed
across the boundary — which is the thing that is otherwise near-impossible to debug.

**`z.looseObject`** keeps unknown fields instead of stripping them, so arbitrary
structured context rides along without a schema change for every new field. The
tradeoff is that a typo in a field name validates fine.

*The endpoint receiving these batches is in the BFF and was not among the sources
read — treat its existence as inference from the schema's shape.*

### 2. A severity-gated JSON-line logger

```ts
const SEVERITY = { debug: 10, info: 20, warn: 30, error: 40 };

export function createConsoleLogger(level: LogLevel): Logger {
  const threshold = SEVERITY[level];
  const at = (entry: LogLevel): LogFn => (fields, message) => {
    if (SEVERITY[entry] < threshold) return;
    const line = JSON.stringify({
      level: entry, time: new Date().toISOString(), ...fields, msg: message,
    });
    if (entry === 'error') { console.error(line); return; }
    if (entry === 'warn')  { console.warn(line);  return; }
    console.log(line);
  };
  return { debug: at('debug'), info: at('info'), warn: at('warn'), error: at('error') };
}
```

The threshold is captured in a closure at construction, so the level cannot drift at
runtime. One `JSON.stringify` per line means output is newline-delimited JSON, which
is what log shippers expect.

Routing `error` to `console.error` and `warn` to `console.warn` keeps stderr and
stdout separated — which matters in a container, where the two streams are often
collected differently. See [[stderr]].

**A sharp edge in the field order.** Caller fields are spread *between* the
built-ins and the message:

```text
{ level, time, ...fields, msg }
```

So a caller field named `level` or `time` silently overwrites the built-in, and a
caller field named `msg` is silently overwritten by the `message` argument. Nothing
warns.

### 3. Error serialization — two functions that differ

A thrown `Error` does not survive `JSON.stringify`: `name`, `message` and `stack`
are non-enumerable, so it serializes to `{}`. Both helpers exist to fix that, and
they do not agree:

| | `serializeError` | `toLogError` |
|---|---|---|
| Non-`Error` input | returned **unchanged** | wrapped as `{ name: 'NonError', message: String(error) }` |
| Return type | `T \| SerializedError` | always `SerializedError` |

Both are exported from the package index. The source marks neither as deprecated and
does not say which to prefer. **Recorded as an unresolved duplication.** For a log
pipeline the always-normalizing one is the safer default, since JavaScript permits
throwing any value — but that is judgement, not something the sources state.

### A cycle worth knowing about

```ts
// Type-only, so this erases at runtime and creates no cycle with index.ts.
import type { LogFieldValue, LogLevel } from './index.js';
```

`index.ts` re-exports from `console-logger.ts`, which imports back from `index.ts`.
The `import type` form erases at compile time, so no runtime cycle exists. Changing
it to a value import would reintroduce one — and the comment is there because the
next person would not guess.

## Related Concepts

- [[nestjs-deployment]] — Where the general guidance comes from
- [[health-checks]] — The other half of knowing whether an app is alive
- [[jarvis-shared-libs]] — `@jarvis/logging` and its siblings
- [[jarvis-bff]] — The backend emitting and receiving these logs
- [[stderr]] — Why `warn` and `error` go to a different stream

## Sources

- [[raw/python/nestjs-deploy.md]]
- [[raw/jarvis/libs/logging/src/index.ts]]
- [[raw/jarvis/libs/logging/src/console-logger.ts]]
- [[raw/jarvis/libs/logging/src/error.utils.ts]]
- [[raw/jarvis/libs/logging/package.json]]
- [[raw/jarvis/libs/LIBS-ARCHITECTURE.md]]

Why `Error` does not survive `JSON.stringify`, the value of NDJSON, and
stdout/stderr separation in containers are general knowledge. The log-receiving
endpoint and the intended choice between the two serializers are not addressed by
these sources.
