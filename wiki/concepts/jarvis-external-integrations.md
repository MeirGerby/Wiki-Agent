# Jarvis External Integrations

## Definition

Jarvis integrates with three major external services to enable [[jarvis-model-training]]: Roberto (model training), Picasso (image tagging), and Task Manager (job orchestration). Each is accessed through a dedicated service class that handles communication, retries, and webhooks.

## Mental Model

Three specialist contractors on retainer. Picasso labels the raw material,
Roberto builds the thing, Task Manager schedules the crew. The BFF is the general
contractor: it never does the specialist work itself, it only knows who to call,
what to hand over, and what to do when a contractor is late or silent.

## Architecture

```
Jarvis BFF
  ├── RobertoService → Roberto API (trains models)
  ├── PicassoService → Picasso API (tags images)
  └── TaskManagerService → Task Manager API (queues jobs)
```

## 1. Roberto (Model Training Service)

### Purpose
Trains deep learning models to detect objects in images.

### Flow

```
User: "Train model for detecting cars"
  ↓
CatalogService: Create model record (status: TRAINING)
  ↓
RobertoService.submit(modelConfig)
  POST to Roberto /train endpoint
  Get back job ID
  ↓
Roberto: Trains asynchronously (hours/days)
  ↓
Webhook: Roberto → BFF /webhook/training-complete
  { jobId, precision, recall, scoreThreshold }
  ↓
BFF: Update model in database
  status = OPERATIONAL
  performance = { precision, recall, scoreThreshold }
  ↓
Frontend: Model appears in list with metrics
```

### Integration Points

**RobertoService** (`bff/src/roberto/`):
```typescript
class RobertoService {
  async submit(modelConfig: ModelConfig): Promise<JobId> {
    // POST to Roberto with training configuration
    // Returns training job ID
  }
  
  async getStatus(jobId: JobId): Promise<JobStatus> {
    // Check job status
  }
}
```

### Metrics Returned
- **Precision**: What fraction of detections are correct
- **Recall**: What fraction of actual objects are detected
- **Recommended Score Threshold**: Confidence level for reliable detections
- **Update timestamp**: When training completed
- **Update user**: Which user initiated training

### Timeouts & Retries
- Timeout: 24 hours (training can take a long time)
- Retries: 3 attempts with exponential backoff (transient failures)
- Persistent failures: Mark as FAILED, allow manual retry

See [[resilience-patterns]].

## 2. Picasso (Image Tagging Service)

### Purpose
Automatically tags images with object labels for use in training datasets.

### Flow

```
User: Uploads image of a vehicle
  ↓
CreateObject: Validates image + metadata
  ↓
PicassoService: "Tag this as a vehicle in RGB sensor group"
  ↓
Picasso: Analyzes image, returns tags
  ↓
Database: Store tagged metadata with object
```

### Integration Points

**PicassoService** (`bff/src/picasso/`):
```typescript
class PicassoService {
  async tag(image: Buffer, taggingClass: string): Promise<TagResult> {
    // Send image to Picasso
    // Get back tagged metadata
  }
}
```

### Tagging Classes

Tagging classes define what labels Picasso can apply:
- Tied to specific objects (e.g., "car", "truck")
- Tied to specific sensor types (RGB, SAR, Thermal)
- Form a controlled vocabulary for consistent labeling

```typescript
interface TaggingClass {
  id: string;           // "tag_car_rgb"
  objectId: string;     // "obj_car"
  sensorGroup: string;  // "RGB"
  label: string;        // Display name
}

// Picasso uses tagging classes to know valid categories
// Frontend displays available classes for user selection
```

### Timeouts & Retries
- Timeout: 5 minutes (image tagging should be fast)
- Retries: 3 attempts with exponential backoff
- Quick failure: If Picasso timeout, skip tagging, allow manual retry

## 3. Task Manager (Job Orchestration)

### Purpose
Manages long-running asynchronous tasks with queuing, scheduling, and status tracking.

### Flow

```
RobertoService: "Queue training job for model X"
  ↓
TaskManager: Creates task record
  {
    id: "task_456",
    status: PENDING,
    type: "train_model",
    config: { modelId, dataSource, params }
  }
  ↓
TaskManager Scheduler: Picks up task when workers available
  ↓
Roberto: Executes training (5 hours)
  ↓
Roberto → TaskManager webhook: "Complete, metrics: ..."
  ↓
TaskManager: Update task status → COMPLETED
  ↓
TaskManager → BFF webhook: "Task 456 completed"
  ↓
BFF: Update model record in database
```

### Integration Points

**TaskManagerService** (`bff/src/task-manager/`):
```typescript
class TaskManagerService {
  async enqueue(task: Task): Promise<TaskId> {
    // Queue task for processing
  }
  
  async getStatus(taskId: TaskId): Promise<TaskStatus> {
    // Check task status
  }
  
  async cancel(taskId: TaskId): Promise<void> {
    // Abort running task
  }
}
```

### Task States

```
PENDING   → Task queued, waiting for worker
  ↓
RUNNING   → Worker actively processing
  ↓
COMPLETED → Finished successfully
  ↓ (or)
FAILED    → Execution failed (user can retry)
  ↓ (or)
CANCELLED → User aborted task
```

### Timeouts & Retries
- Timeout: 30 minutes (umbrella timeout for any task)
- Retries: 3 attempts for transient failures
- Manual retry: User can retry from UI on failure

See [[async-job-processing]] and [[resilience-patterns]].

## Integration Boundaries

### Service Isolation

Each external service is wrapped in its own class:

```typescript
// Decoupling: Services don't call each other directly
// Change Roberto API → only RobertoService changes
// Change Picasso API → only PicassoService changes
// Change Task Manager → only TaskManagerService changes

// Benefits:
// - Testability: Mock one service at a time
// - Monitoring: Track each service's health
// - Error handling: Centralized retry/timeout logic
// - Configuration: Each service has its own secrets
```

### Webhook Integration

See [[webhook-integration]].

```typescript
app.post('/webhook/training-complete', async (c) => {
  // 1. Verify webhook signature (Roberto API key)
  const isValid = verifySignature(c.req, ROBERTO_WEBHOOK_SECRET);
  if (!isValid) return c.text('Unauthorized', 401);
  
  // 2. Parse event
  const event = await c.req.json();
  // { jobId, status, metrics, timestamp }
  
  // 3. Update database
  await db.models.update(
    { trainingJobId: event.jobId },
    { status: 'OPERATIONAL', performance: event.metrics }
  );
  
  // 4. Return success
  return c.json({ ok: true });
});
```

## Configuration

Environment variables (secrets manager):

```
ROBERTO_API_URL=https://roberto.internal/api
ROBERTO_API_KEY=***secret***
ROBERTO_WEBHOOK_SECRET=***secret***

PICASSO_API_URL=https://picasso.internal/api
PICASSO_API_KEY=***secret***

TASK_MANAGER_API_URL=https://taskmanager.internal/api
TASK_MANAGER_API_KEY=***secret***
TASK_MANAGER_WEBHOOK_SECRET=***secret***
```

Never commit credentials to git. Use a secrets manager (AWS Secrets Manager, Vault, etc.).

## Complete Example: Training a New Model

```
1. User clicks "Train new model" in web frontend
   Input: { objectId, sensorGroup, geography, dataset }
   ↓
2. Frontend calls: bff.catalog.createModel(input)
   ↓
3. BFF AuthService: Verify user is authenticated
   ↓
4. BFF PermissionsService: Check user has 'create_model' permission
   ↓
5. BFF CatalogService.createModel():
   - Create model record in database
   - status = TRAINING
   ↓
6. BFF RobertoService.submit(modelConfig):
   - POST to Roberto /train endpoint with config
   - Roberto returns training jobId
   - Save jobId to model record
   ↓
7. BFF TaskManagerService.enqueue():
   - Queue training job
   - Set timeout: 24 hours
   - Task Manager Scheduler picks it up when ready
   ↓
8. Roberto executes training asynchronously
   - Load training dataset
   - Train neural network
   - Evaluate on test set
   - Compute precision, recall, confidence threshold
   - Takes 1-48 hours depending on dataset size
   ↓
9. Roberto completes, calls webhook:
   POST /webhook/training-complete
   Headers: X-Signature: sha256=...
   Body: {
     jobId: "train_123",
     status: "COMPLETED",
     metrics: {
       precision: 0.95,
       recall: 0.92,
       scoreThreshold: 0.75
     },
     timestamp: 1726918292000
   }
   ↓
10. BFF receives webhook
    - Verifies signature using ROBERTO_WEBHOOK_SECRET
    - Updates model record:
      status = OPERATIONAL
      performance = { precision, recall, scoreThreshold }
      updateTime = now()
    - Returns 200 OK
   ↓
11. Frontend polls for status (every 5 seconds)
    - Gets updated status: OPERATIONAL
    - Fetches model details
    ↓
12. Frontend displays new model in list with metrics
    - User sees: "Car Detector (RGB, Israel) - Precision: 95%, Recall: 92%"
    - Happy user!
```

## Error Scenarios

### Roberto Timeout (24 hours)
```
Task Manager: "Training still running after 24 hours"
  ↓
Task Manager: Mark task FAILED, reason "Timeout"
  ↓
Task Manager → BFF webhook: "Task failed"
  ↓
BFF: Update model status = FAILED
  ↓
Frontend: Shows error, allows manual retry
```

### Network Failure During Submission
```
RobertoService.submit(): Network error
  ↓
Resilience: Retry with exponential backoff (3 attempts)
  ↓
If all fail: Throw error to user
  ↓
User can manually retry from UI
```

### Picasso Timeout (5 minutes)
```
User uploads image
  ↓
Picasso times out
  ↓
Skip tagging, image still stored without tags
  ↓
Frontend shows warning: "Image stored but couldn't auto-tag"
  ↓
User can manually tag or skip
```

## Related Concepts

- [[jarvis]] — Project overview
- [[async-job-processing]] — Job queuing and status tracking
- [[webhook-integration]] — Async notifications
- [[resilience-patterns]] — Retries, timeouts, error handling
- [[jarvis-bff]] — Service layer that calls these
- [[jarvis-model-training]] — Training flow

## Sources

- [[raw/jarvis/EXTERNAL-INTEGRATIONS.md]]
