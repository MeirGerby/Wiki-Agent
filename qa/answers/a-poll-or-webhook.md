---
id: a-poll-or-webhook
question: q-poll-or-webhook
concepts:
  - webhook-integration
  - async-job-processing
  - jarvis-model-training
origin: generated
---

# The webhook updates the server; the client still polls

## Short answer

They answer different questions. The webhook tells the backend that training finished; polling is how the browser finds out, because a webhook cannot reach it.

## Division of labour

```
Roberto  --webhook-->  BFF        (server learns: done, here are the metrics)
Browser  --poll----->  BFF        (client learns: status changed)
```

The webhook removes the backend's need to ask repeatedly. It does nothing for the
browser, which has no public endpoint to receive a callback on.

## Why not poll all the way through

Polling an external service from the backend means either a slow feedback loop or
a lot of wasted requests. Being pushed to once is strictly better for that hop.

## Why the client still polls

Until the app holds an open channel -- WebSocket or SSE -- the browser can only ask.
The poll interval then sets how stale the UI can be, and it is cheap because it
hits your own BFF rather than Roberto.

## Sources

- [[raw/jarvis/EXTERNAL-INTEGRATIONS.md]]

The source document describes this flow architecturally. Concrete payloads, retry
counts and timeouts in it were inferred rather than read from code -- treat those
specifics as uncertain.

## Question

- [[q-poll-or-webhook]]

## Related Concepts

- [[webhook-integration]]
- [[async-job-processing]]
- [[jarvis-model-training]]
