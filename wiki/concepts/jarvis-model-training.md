# Jarvis Model Training Flow

## Definition

The model training flow is an [[async-job-processing]] pipeline that orchestrates model creation, training via Roberto, job management, and completion notifications. It demonstrates how Jarvis combines synchronous API calls with asynchronous backend processing.

## Mental Model

Dropping film at a photo lab. You hand it over and get a ticket back in seconds —
the developing takes hours. You do not stand at the counter waiting: you keep the
ticket, and the lab calls you when the prints are ready. The API call is the
ticket; the webhook is the call back.

## Overview

```
User Action → BFF Creates Model → Submit to Roberto → Queue in Task Manager
                                                            ↓
                                                      (background processing)
                                                            ↓
                                    Roberto Trains Model (hours) → Webhook
                                                            ↓
                                          BFF Updates Model Record
                                                            ↓
                                     Frontend Sees Completion
```

## Step 1: User Initiates Training

Frontend UI collects:
- **Object ID**: What to detect (e.g., "car")
- **Sensor Group**: Detection type (e.g., "RGB", "SAR", "Thermal")
- **Geography**: Region model covers (e.g., "israel")
- **Dataset URL**: Training data source

```typescript
// Frontend
const response = await client.catalog.createModel.mutate({
  objectId: 'car',
  sensorGroup: 'RGB',
  geography: 'israel',
  datasetUrl: 'https://datasets.company.com/cars-rgb-israel.zip',
});

// Frontend gets: { modelId: 'model_456', status: 'TRAINING' }
// Stores modelId in state for polling
```

## Step 2: BFF Authenticates & Validates

```typescript
// BFF catalogRouter.createModel()

// 1. User must be authenticated (authedProcedure)
if (!ctx.user) throw new AuthError('Not authenticated');

// 2. User must have 'create_model' permission
const hasPermission = await ctx.cradle
  .resolve('permissionsService')
  .check(ctx.user, 'create_model');
if (!hasPermission) throw new AuthError('Permission denied');

// 3. Validate input
const input = CreateModelInput.parse({
  objectId, sensorGroup, geography, datasetUrl
});

// 4. Check that referenced objects exist
const object = await ctx.cradle
  .resolve('catalogService')
  .getObject(objectId);
if (!object) throw new Error('Object not found');
```

## Step 3: Create Model Record (TRAINING)

```typescript
// CatalogService.createModel()

const model = await db.models.insert({
  id: generateId(),
  englishName: `${object.englishName} (${sensorGroup}, ${geography})`,
  hebrewName: `${object.hebrewName} (${sensorGroup}, ${geography})`,
  operationalStatus: 'TRAINING',
  sensorGroupName: sensorGroup,
  geography: geography,
  performance: null,      // Will be populated on completion
  depthThreshold: null,
  dexterThreshold: null,
  lastUpdateUser: ctx.user.userId,
  updateTime: new Date(),
}).returning('*');

return model;
```

Model is now in database with status `TRAINING`.

## Step 4: Submit to Roberto

```typescript
// RobertoService.submit()

const modelConfig = {
  modelId: model.id,
  objectId: input.objectId,
  sensorGroup: input.sensorGroup,
  geography: input.geography,
  datasetUrl: input.datasetUrl,
};

// With retries + exponential backoff
let jobId;
try {
  const response = await retry(3, async () => {
    return fetch('https://roberto.internal/api/train', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ROBERTO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelConfig),
    });
  });
  
  const { jobId: jobIdFromRoberto } = await response.json();
  jobId = jobIdFromRoberto;
} catch (error) {
  // If Roberto unavailable, update model status to FAILED
  await db.models.update(
    { id: model.id },
    { operationalStatus: 'FAILED' }
  );
  throw new Error('Failed to submit to Roberto', { cause: error });
}

// Save Roberto jobId to model record (for tracking)
await db.models.update(
  { id: model.id },
  { trainingJobId: jobId }
);

return jobId;
```

## Step 5: Enqueue in Task Manager

```typescript
// TaskManagerService.enqueue()

const task = {
  id: `task_${jobId}`,
  status: 'PENDING',
  type: 'train_model',
  config: {
    modelId: model.id,
    jobId: jobId,
    objectId: input.objectId,
    datasetUrl: input.datasetUrl,
  },
  createdAt: new Date(),
  timeout: 24 * 60 * 60 * 1000, // 24 hours
};

await fetch('https://taskmanager.internal/api/tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TASK_MANAGER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(task),
});

// Task is now queued
// Task Manager scheduler will pick it up when workers available
```

## Step 6: Return to Frontend

BFF returns immediately (doesn't wait for training):

```typescript
// Frontend received response
{
  modelId: 'model_456',
  status: 'TRAINING',
  englishName: 'Car (RGB, Israel)',
}

// Frontend navigates to model details page
// Starts polling for status changes
```

**Total time**: ~100ms (fast!)

## Step 7: Backend Processing (Asynchronous)

```
Timeline (hours later):

T+0:    Task enqueued in Task Manager
T+5m:   Task Manager scheduler picks up task (workers available)
T+5m:   Roberto receives: "Train model for detecting cars using dataset"
T+5m:   Roberto downloads training dataset (1000s of images)
T+30m:  Dataset preprocessed, neural network initialized
T+1h:   Training in progress (gradient descent, backprop)
T+5h:   Training complete, model converged
T+5h:   Evaluation on test set
T+5h:   Compute metrics: precision=0.95, recall=0.92, threshold=0.75
T+5h:   Send webhook to BFF
```

## Step 8: Roberto Completes, Sends Webhook

```typescript
// Roberto's background process completes training

const metrics = {
  precision: 0.95,
  recall: 0.92,
  scoreThreshold: 0.75,
};

// POST to BFF webhook endpoint
fetch('https://my-bff.com/webhook/training-complete', {
  method: 'POST',
  headers: {
    'X-Webhook-Signature': 'sha256=...',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    jobId: jobId,
    status: 'COMPLETED',
    result: metrics,
    timestamp: Date.now(),
  }),
});

// BFF webhook receives notification (Step 9)
```

## Step 9: BFF Webhook Handler

```typescript
// Hono app.post('/webhook/training-complete')

// 1. Verify signature
const signature = c.req.header('X-Webhook-Signature');
const body = await c.req.text();
const isValid = verifySignature(body, signature, ROBERTO_WEBHOOK_SECRET);
if (!isValid) return c.text('Unauthorized', 401);

// 2. Parse event
const event = JSON.parse(body);
// { jobId, status, result, timestamp }

// 3. Find model by training jobId
const model = await db.models.findOne({ trainingJobId: event.jobId });
if (!model) {
  console.warn('Webhook for unknown job:', event.jobId);
  return c.json({ ok: true }); // Still return 200 (idempotent)
}

// 4. Update model record
await db.models.update(
  { id: model.id },
  {
    operationalStatus: 'OPERATIONAL',
    performance: event.result,
    updateTime: new Date(),
    lastUpdateUser: 'system',
  }
);

// 5. Optionally notify connected clients via WebSocket
broadcast({
  type: 'model-training-complete',
  modelId: model.id,
  metrics: event.result,
});

return c.json({ ok: true });
```

## Step 10: Frontend Discovers Update

Frontend is polling for status:

```typescript
// useEffect in React component
const pollStatus = async () => {
  const model = await client.catalog.getModel.query({ modelId });
  
  if (model.operationalStatus === 'OPERATIONAL') {
    // Update complete!
    setModel(model);
    setMetrics(model.performance);
    stopPolling();
  } else if (model.operationalStatus === 'FAILED') {
    // Training failed
    setError('Training failed. Check logs.');
    stopPolling();
  } else {
    // Still training, poll again in 5 seconds
    setTimeout(pollStatus, 5000);
  }
};

pollStatus();
```

## Error Handling

### Roberto Submission Fails

```
RobertoService.submit() throws error after 3 retries
  ↓
CatalogService catches error
  ↓
Update model: status = FAILED, error message
  ↓
Return error to frontend
  ↓
Frontend shows: "Failed to start training. Try again?"
  ↓
User can click "Retry"
```

### Training Timeout (24 hours)

```
Task Manager detects: task running > 24 hours
  ↓
Task Manager marks: status = FAILED, reason = "Timeout"
  ↓
Task Manager → BFF webhook (same /webhook/training-complete endpoint)
  ↓
BFF updates: status = FAILED, error = "Training timeout"
  ↓
Frontend polling sees failure
  ↓
User can manually retry or investigate logs
```

### Webhook Delivery Fails

```
BFF webhook endpoint returns 500 error
  ↓
Roberto retries (exponential backoff)
  ↓
BFF eventually returns 200
  ↓
Model status updated
  ↓
Frontend polling eventually sees update
```

See [[webhook-integration]].

## Related Concepts

- [[jarvis]] — Project overview
- [[async-job-processing]] — Async job queuing pattern
- [[jarvis-external-integrations]] — Roberto, Task Manager services
- [[resilience-patterns]] — Retries, timeouts, error handling
- [[webhook-integration]] — Webhook notifications
- [[jarvis-bff]] — BFF implementation
- [[jarvis-data-model]] — Model entity definition

## Sources

- [[raw/jarvis/EXTERNAL-INTEGRATIONS.md]]
- [[raw/jarvis/MODEL-CATALOG-DATA-MODEL.md]]
