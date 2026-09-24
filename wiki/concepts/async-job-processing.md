# Asynchronous Job Processing

## Definition

Asynchronous job processing is a pattern where long-running operations (training models, processing images, generating reports) are queued separately from the main request/response cycle. The client gets an immediate response, then polling or webhooks notify when the job completes.

## Mental Model

**Synchronous** (blocks user):
```
User: "Train model"
       ↓ (user waits, app is busy)
Server: Training... (5 hours)
       ↓ (finally done)
Server: "Done! Model ready"
User: (timed out after 30 seconds)
```

**Asynchronous** (responsive):
```
User: "Train model"
       ↓
Server: "Job queued. ID: job_123"
User: Gets response immediately, sees status page
       ↓ (background)
Job Processor: Trains model (5 hours)
       ↓
Job Processor: Writes results to database
       ↓
Frontend: Polls for status, sees "COMPLETED"
```

## Components

### 1. Job Queue
A system that stores pending jobs:
```typescript
interface Job {
  id: string;              // job_123
  status: JobStatus;       // PENDING, RUNNING, COMPLETED, FAILED
  type: string;            // 'train_model'
  config: JobConfig;       // { modelId, data, params }
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: JobResult;
  error?: string;
}

enum JobStatus {
  PENDING = 'PENDING',     // Waiting for worker
  RUNNING = 'RUNNING',     // Actively processing
  COMPLETED = 'COMPLETED', // Finished successfully
  FAILED = 'FAILED',       // Failed (retry possible)
  CANCELLED = 'CANCELLED', // User aborted
}
```

### 2. Job Worker
Process that picks up jobs and executes them:
```typescript
// Worker loop
while (true) {
  // Get next pending job
  const job = await jobQueue.getNextPending();
  if (!job) {
    await sleep(1000); // No jobs, wait
    continue;
  }
  
  // Mark as running
  await jobQueue.update(job.id, { status: 'RUNNING', startedAt: now() });
  
  try {
    // Do the work
    const result = await executeJob(job);
    
    // Mark complete
    await jobQueue.update(job.id, {
      status: 'COMPLETED',
      completedAt: now(),
      result,
    });
  } catch (error) {
    // Mark failed
    await jobQueue.update(job.id, {
      status: 'FAILED',
      error: error.message,
      completedAt: now(),
    });
  }
}
```

### 3. Job Submission (Client-side)
```typescript
// User initiates job
const response = await bff.trainModel.mutate({
  objectId: 'car',
  sensorGroup: 'RGB',
  geography: 'israel',
});
// Response: { jobId: 'job_123', status: 'PENDING' }

// Store job ID
localStorage.setItem('trainingJobId', response.jobId);
```

### 4. Status Polling (Client-side)
```typescript
// Poll for updates
const pollStatus = async (jobId) => {
  const status = await bff.job.getStatus.query({ jobId });
  
  if (status === 'COMPLETED') {
    // Job done, show results
    const result = await bff.job.getResult.query({ jobId });
    displayModel(result);
  } else if (status === 'FAILED') {
    // Job failed, show error
    showError('Training failed. Try again?');
  } else {
    // Still running, poll again in 5 seconds
    setTimeout(() => pollStatus(jobId), 5000);
  }
};

pollStatus(jobId);
```

## Jarvis Model Training Example

Complete flow with three services:

```
1. User: "Train model for detecting cars"
   ↓
2. BFF: Create model record (status: TRAINING)
   ↓
3. BFF: Submit to Roberto (training service)
   Roberto returns: { jobId: 'train_123' }
   ↓
4. BFF: Enqueue in Task Manager
   Task Manager creates: { id: 'task_456', status: PENDING }
   ↓
5. Task Worker picks up job:
   - Pull training data
   - Train neural network (takes hours)
   - Evaluate precision, recall, threshold
   ↓
6. Roberto → Task Manager webhook:
   "Training complete, precision=0.95, recall=0.92"
   ↓
7. Task Manager → BFF webhook:
   "Task 456 completed"
   ↓
8. BFF: Update model record in database
   - status = OPERATIONAL
   - performance = { precision, recall, threshold }
   ↓
9. Frontend: Polling sees status changed
   - Shows model in list
   - Displays metrics
   - User happy!
```

## Resilience Patterns

### Retries
```typescript
// Retry failed jobs
const MAX_RETRIES = 3;
if (job.status === 'FAILED' && job.retryCount < MAX_RETRIES) {
  await jobQueue.update(job.id, {
    status: 'PENDING',
    retryCount: job.retryCount + 1,
  });
  // Worker will pick it up again
}
```

### Timeouts
```typescript
// Abort stuck jobs
const TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
if (job.status === 'RUNNING' && now() - job.startedAt > TIMEOUT) {
  await jobQueue.update(job.id, {
    status: 'FAILED',
    error: 'Job timeout after 24 hours',
  });
}
```

### Exponential Backoff
```typescript
// Retry with increasing delays
const delays = [1, 2, 4, 8, 16]; // seconds
const delayMs = delays[retryCount] * 1000;
await sleep(delayMs);
// Retry
```

## Related Concepts

- [[webhook-integration]] — Notifications when jobs complete
- [[resilience-patterns]] — Retries, timeouts, error handling
- [[jarvis-external-integrations]] — Roberto, Task Manager use async processing
- [[jarvis-model-training]] — Concrete async pipeline in Jarvis

## Sources

- [[raw/jarvis/EXTERNAL-INTEGRATIONS.md]]
- [[raw/jarvis/apps/model-catalog/bff/src/task-manager/task-manager.service.ts]]

Queue mechanics in general (broker choice, delivery guarantees, backpressure) are
general knowledge. Specific timeout and retry values in the source document were
inferred from the architecture, not read from configuration — treat them as uncertain.
