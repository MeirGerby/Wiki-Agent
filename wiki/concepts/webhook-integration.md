# Webhook Integration

## Definition

Webhooks are HTTP callbacks where an external service (Roberto, Task Manager, etc.) POSTs to a BFF endpoint to notify about events. Unlike polling (client repeatedly asks "any updates?"), webhooks are push-based (server tells client "something happened").

## Mental Model

**Polling** (client asks repeatedly):
```
Frontend: "Is training done?" → BFF
BFF: "No"
Frontend: (waits 5 seconds)
Frontend: "Is training done?" → BFF
BFF: "No"
Frontend: (waits 5 seconds)
... (hundreds of requests)
Frontend: "Is training done?" → BFF
BFF: "Yes!"
```

**Webhooks** (server notifies):
```
Frontend: "Subscribe to training events" → BFF
BFF: "OK"

(training happens...)

Roberto → BFF: POST /webhook/training-complete
              { jobId, precision, recall, threshold }
BFF: Updates database
Frontend: (still polling, but gets update on next request)
```

## Request Flow

### Setup
```typescript
// BFF registers webhook with external service
const registerWebhook = async () => {
  await fetch('https://roberto.internal/webhooks', {
    method: 'POST',
    body: JSON.stringify({
      url: 'https://my-bff.com/webhook/training-complete',
      events: ['training.completed', 'training.failed'],
      secret: 'webhook_secret_key', // For signature verification
    }),
  });
};
```

### Event Delivery
```
1. Roberto finishes training job
   ↓
2. Roberto sends HTTP POST to webhook URL
   POST https://my-bff.com/webhook/training-complete
   Headers: { 'X-Webhook-Signature': 'sha256=...' }
   Body: { jobId, status, result, timestamp }
   ↓
3. BFF receives webhook
4. BFF verifies signature (proves Roberto sent it)
5. BFF processes event (update database, trigger notifications)
6. BFF responds with 200 OK
```

## Implementation

### Receiving Webhooks
```typescript
// BFF endpoint
app.post('/webhook/training-complete', async (c) => {
  // 1. Verify signature
  const signature = c.req.header('X-Webhook-Signature');
  const body = await c.req.text();
  const hash = createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  
  if (`sha256=${hash}` !== signature) {
    return c.text('Unauthorized', 401);
  }
  
  // 2. Parse event
  const event = JSON.parse(body);
  // { jobId, status: 'COMPLETED', result, timestamp }
  
  // 3. Update database
  await db.models.update(
    { trainingJobId: event.jobId },
    {
      status: 'OPERATIONAL',
      performance: event.result.metrics,
      updateTime: new Date(event.timestamp),
    }
  );
  
  // 4. Optionally notify connected clients (via WebSocket)
  broadcast({ type: 'model-trained', jobId: event.jobId });
  
  // 5. Return success
  return c.json({ ok: true });
});
```

### Signature Verification
```typescript
// Only accept webhooks actually from the external service
import { createHmac } from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Use constant-time comparison to prevent timing attacks
  return timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  );
}
```

## Benefits vs Polling

| Aspect | Polling | Webhooks |
|--------|---------|----------|
| **Traffic** | Many requests | Only when events happen |
| **Latency** | Delay between update and client knowledge | Instant notification |
| **Server load** | High (repetitive queries) | Low |
| **Implementation** | Simple | Requires endpoint |
| **Reliability** | Guaranteed (eventual) | Needs retry logic |

## Webhook Reliability

### Idempotence
Same webhook may be delivered multiple times:
```typescript
// Use idempotent keys to prevent duplicate processing
const PROCESSED_WEBHOOKS = new Set(); // Or use database

app.post('/webhook/training-complete', async (c) => {
  const event = await c.req.json();
  const idempotencyKey = event.jobId + '_' + event.timestamp;
  
  // Check if we've already processed this
  if (PROCESSED_WEBHOOKS.has(idempotencyKey)) {
    return c.json({ ok: true }); // Already done, return success
  }
  
  // Process event
  await updateDatabase(event);
  
  PROCESSED_WEBHOOKS.add(idempotencyKey);
  return c.json({ ok: true });
});
```

### Retries
External service retries if webhook fails:
```
Attempt 1: POST /webhook → 500 Internal Error
Wait 5 seconds
Attempt 2: POST /webhook → 500 Internal Error
Wait 30 seconds
Attempt 3: POST /webhook → 200 OK ✓
```

## Hybrid Approach (Jarvis)

Jarvis combines polling + webhooks:

```typescript
// 1. User starts training
const model = await bff.catalog.createModel.mutate({...});
// Gets back: { modelId, status: 'TRAINING' }

// 2. BFF submits to Roberto, gets jobId
// BFF also registers webhook with Roberto

// 3. Frontend polls for updates (belt-and-suspenders)
const pollStatus = async () => {
  const status = await bff.job.getStatus.query({ jobId });
  if (status === 'COMPLETED') showResults();
  else setTimeout(pollStatus, 5000);
};

// 4. When Roberto completes, it calls webhook
// BFF updates database immediately

// 5. Next frontend poll gets updated status
// Or (future) WebSocket pushes update in real-time
```

## Security

### Secret Key
```typescript
// Keep webhook secret in environment variable
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Never commit to git
// Rotate periodically
// Use different secret per external service
```

### HTTPS Only
```
WRONG: http://my-bff.com/webhook/...
RIGHT: https://my-bff.com/webhook/...
```

### IP Allowlisting (Optional)
```typescript
// Allow webhook from specific IPs only
const ALLOWED_IPS = ['1.2.3.4', '5.6.7.8']; // Roberto's IPs
const clientIp = c.req.header('X-Forwarded-For');
if (!ALLOWED_IPS.includes(clientIp)) {
  return c.text('Forbidden', 403);
}
```

## Related Concepts

- [[async-job-processing]] — Jobs that complete asynchronously
- [[resilience-patterns]] — Retry logic for webhooks
- [[jarvis-external-integrations]] — Webhooks from Roberto, Task Manager
- [[trigger-based-notify]] — database-triggered notifications as an alternative to HTTP callbacks
- [[jarvis-model-training]] — Training completion delivered by webhook

## Sources

- [[raw/jarvis/EXTERNAL-INTEGRATIONS.md]]

Webhook security guidance (signature verification, replay protection) is general
knowledge. The source document describes the Roberto/Task Manager callback flow at
an architectural level; the concrete payload and endpoint shapes were not verified
against code — treat them as uncertain.
