# External Service Integrations

> **Provenance note.** This document was written by reading `container.ts`, `router.ts`,
> `main.ts`, the service class signatures and the contract types. The service *names*,
> *responsibilities* and *wiring* are taken from that code. The concrete timeout values,
> retry counts, task state names and webhook payloads below were **inferred** to describe
> a plausible flow — they were not read from configuration and should be verified against
> the Roberto / Picasso / Task Manager implementations before being relied on.

The Jarvis Model Catalog integrates with three major external systems to enable training, tagging, and task management.

## 1. Roberto (Model Training Service)

**Purpose**: Trains deep learning models to detect objects in images.

### Integration Points

**RobertoService** (`bff/src/roberto/`):
- Triggered when user creates or retries a model
- Submits training job configuration to Roberto
- Receives back job ID and status

### Flow

```
User: "Train new model for detecting cars"
       ↓
CatalogService: Create model record (status: TRAINING)
       ↓
RobertoService: Submit to Roberto
       ↓
Roberto: Trains model asynchronously
       ↓
Webhook/Poll: Status updates (OPERATIONAL or FAILED)
       ↓
Database: Update model with metrics (precision, recall, threshold)
```

### Model Metadata

When training completes, Roberto returns:
- **Precision**: What fraction of detections are correct
- **Recall**: What fraction of actual objects are detected
- **Recommended Score Threshold**: Confidence level for reliable detections
- **Update timestamp**: When training completed
- **Update user**: Which user initiated training

## 2. Picasso (Image Tagging Service)

**Purpose**: Tags images with object labels for use in training datasets.

### Integration Points

**PicassoService** (`bff/src/picasso/`):
- Called when new objects are created with images
- Automatically tags the image based on tagging classes
- Returns tagged metadata

### Flow

```
User: Uploads image of a vehicle
       ↓
CreateObject: Validates image + metadata
       ↓
PicassoService: "Tag this as a vehicle in sensor group RGB"
       ↓
Picasso: Analyzes image, returns tags
       ↓
Database: Store tagged metadata with object
```

### Tagging Classes

**Tagging classes** define what labels Picasso can apply:
- Tied to specific objects (e.g., "car", "truck")
- Tied to specific sensor types (RGB, SAR, Thermal)
- Form a controlled vocabulary for consistent labeling

## 3. Task Manager (Job Orchestration)

**Purpose**: Manages long-running asynchronous tasks (training, processing, etc.)

### Integration Points

**TaskManagerService** (`bff/src/task-manager/`):
- Enqueues training jobs
- Tracks job status (pending, running, completed, failed)
- Supports retries and cancellation

### Flow

```
RobertoService: "Queue training job for model X"
       ↓
TaskManager: Creates task record with:
  - Task ID
  - Status: PENDING
  - Configuration (model params, data source)
       ↓
TaskManager Scheduler: Picks up task when workers available
       ↓
Roberto: Executes training
       ↓
TaskManager: Updates status → COMPLETED or FAILED
       ↓
Webhook: Notifies BFF of completion
       ↓
BFF: Updates model record in database
```

### Task States

- **PENDING** - Task queued, waiting for worker
- **RUNNING** - Worker actively processing
- **COMPLETED** - Finished successfully
- **FAILED** - Execution failed (retry possible)
- **CANCELLED** - User aborted task

## Service Isolation

Each external service is wrapped in its own service class:

```typescript
// RobertoService
submit(modelConfig): Promise<TrainingJobId>
getStatus(jobId): Promise<JobStatus>

// PicassoService
tag(image, taggingClass): Promise<TagResult>

// TaskManagerService
enqueue(task): Promise<TaskId>
cancel(taskId): Promise<void>
getStatus(taskId): Promise<TaskStatus>
```

Benefits:
- **Decoupling**: Change Roberto API without touching catalog logic
- **Testing**: Mock services for unit tests
- **Monitoring**: Track integration health
- **Error handling**: Centralized retry/timeout logic

## Resilience Patterns

### Timeouts
- Roberto training: timeout after 24 hours
- Picasso tagging: timeout after 5 minutes
- Task Manager: timeout after 30 minutes

### Retries
- Transient failures (network): retry 3 times with exponential backoff
- Persistent failures: mark as FAILED, notify user
- User can manually retry from UI

### Webhooks
- External services notify BFF of completion via webhook
- BFF updates model/task status in database
- Frontend polls for status updates (or receives via WebSocket)

## Configuration

External service endpoints configured via environment variables:

```
ROBERTO_API_URL=https://roberto.internal/api
PICASSO_API_URL=https://picasso.internal/api
TASK_MANAGER_API_URL=https://taskmanager.internal/api
```

Credentials (API keys, auth tokens) stored in Secrets Manager, not in code.

## Example: Training a New Model

Complete flow involving all three services:

```
1. User clicks "Train new model" in UI
   Input: { objectId, sensorGroup, geography, dataset }

2. BFF CatalogService.createModel():
   - Create model record (status: TRAINING)
   - Save to database

3. RobertoService.submit(modelConfig):
   - POST to Roberto /train endpoint
   - Get back training job ID
   - Save job ID to model record

4. TaskManagerService.enqueue():
   - Queue training job in Task Manager
   - Scheduler picks it up when ready

5. Roberto executes training:
   - Loads training data
   - Trains neural network
   - Evaluates on test set
   - Computes precision, recall, threshold

6. Roberto → TaskManager webhook:
   - Training complete
   - Return metrics and model weights

7. TaskManager → BFF webhook:
   - Notify of completion

8. BFF updates database:
   - model.status = OPERATIONAL
   - model.performance = { precision, recall, threshold }
   - model.updateTime = now()

9. Frontend receives update:
   - Refresh model list
   - Show new model with metrics
```

This asynchronous flow allows UI to remain responsive while training runs for hours.
