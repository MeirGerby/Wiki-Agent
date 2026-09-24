# Resilience Patterns

## Definition

Resilience patterns are design techniques to keep systems operating when components fail: retries for transient errors, timeouts to prevent hanging, circuit breakers to fail fast, and bulkheads to isolate failures.

## Mental Model

A resilient system doesn't prevent failures—it handles them gracefully:

```
Fragile system:
API call fails → Entire request fails → User gets error
                                      → No recovery attempt

Resilient system:
API call fails → Retry with backoff
             → If still fails, use cached data
             → If still nothing, fail gracefully with partial result
             → User gets degraded but working experience
```

## Core Patterns

### 1. Retries

**Problem**: Transient failures (network hiccup, temporary API slowdown) shouldn't crash the request.

**Solution**: Automatically retry failed operations.

```typescript
async function callExternalAPI(config) {
  const MAX_RETRIES = 3;
  const delays = [100, 500, 2000]; // ms
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fetch('https://external-api.com', config);
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        await sleep(delays[attempt]);
        continue;
      }
      throw error; // All retries exhausted
    }
  }
}
```

### 2. Exponential Backoff

**Problem**: Hammering a failing API with retries makes it worse.

**Solution**: Wait longer between retries.

```
Attempt 1: Fail → Wait 100ms
Attempt 2: Fail → Wait 500ms
Attempt 3: Fail → Wait 2000ms
Attempt 4: Fail → Give up
```

```typescript
const delays = [
  1 * 1000,      // 1 second
  2 * 1000,      // 2 seconds
  4 * 1000,      // 4 seconds
  8 * 1000,      // 8 seconds
  16 * 1000,     // 16 seconds
];

// With jitter to prevent thundering herd
const jitter = Math.random() * 1000;
const delayMs = delays[attempt] + jitter;
```

### 3. Timeouts

**Problem**: API hangs forever, request never completes.

**Solution**: Abort after N seconds.

```typescript
// Roberto training timeout: 24 hours
const ROBERTO_TIMEOUT = 24 * 60 * 60 * 1000;

const controller = new AbortController();
const timeout = setTimeout(
  () => controller.abort(),
  ROBERTO_TIMEOUT
);

try {
  const response = await fetch(url, {
    signal: controller.signal,
  });
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Operation timed out');
  }
}
```

**Timeouts in Jarvis**:
```
Roberto (model training): 24 hours
Picasso (image tagging): 5 minutes
Task Manager (job orchestration): 30 minutes
```

### 4. Circuit Breaker

**Problem**: External service is down. Keep trying = wasted requests = slow app.

**Solution**: "Open" the circuit (stop trying) if error rate too high.

```
Circuit States:

CLOSED (normal)
  ↓
  Requests pass through
  If errors accumulate → open circuit
  ↓
OPEN (circuit breaker tripped)
  ↓
  Reject requests immediately (fail fast)
  After waiting period → try half-open
  ↓
HALF-OPEN (testing)
  ↓
  Allow 1-2 test requests
  If success → close circuit
  If fail → open circuit again
```

```typescript
class CircuitBreaker {
  state = 'CLOSED';
  failureCount = 0;
  lastFailureTime = null;
  
  call(fn) {
    if (this.state === 'OPEN') {
      // Too many failures, stop trying
      if (Date.now() - this.lastFailureTime > 60000) {
        this.state = 'HALF-OPEN'; // Try again after 60s
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount > 5) {
      this.state = 'OPEN'; // Too many failures
    }
  }
}

const robertoCircuit = new CircuitBreaker();
try {
  await robertoCircuit.call(() => trainModel(config));
} catch (error) {
  if (error.message.includes('Circuit')) {
    // Show user: "Training service is down, try later"
  }
}
```

### 5. Bulkheads (Resource Isolation)

**Problem**: One overloaded external service drains all request handlers.

**Solution**: Limit concurrent requests to external service.

```typescript
// Only allow 5 concurrent requests to Roberto
const robertoQueue = new PQueue({ concurrency: 5 });

async function trainModel(config) {
  return robertoQueue.add(() => 
    fetch('https://roberto.api/train', { body: config })
  );
}

// Requests beyond 5 are queued, not rejected
// No single service can exhaust all handlers
```

### 6. Graceful Degradation

**Problem**: Service fails but app can still work partially.

**Solution**: Use fallback or cached data.

```typescript
async function listModels() {
  try {
    // Try fresh data
    return await fetchFromDatabase();
  } catch (error) {
    // If database down, return cached
    console.warn('Database error, using cache:', error);
    return cachedModels || [];
  }
}

async function getModelMetrics(modelId) {
  try {
    // Try to calculate metrics
    return await computeMetrics(modelId);
  } catch (error) {
    // If computation fails, return last known metrics
    return lastKnownMetrics[modelId] || {
      precision: null,
      recall: null,
    };
  }
}
```

## Jarvis Example: Training Flow

```
User: "Train model"
  ↓
BFF: Create model record (TRAINING)
  ↓
RobertoService.submit():
  • Try Roberto API (with 3 retries, exponential backoff)
  • If fails after retries:
    - Check circuit breaker
    - If OPEN: throw "Roberto service unavailable"
    - If CLOSED but failed: log error, throw
  • If succeeds: get jobId
  ↓
TaskManager.enqueue():
  • Queue job with timeout 30 minutes
  • If timeout: mark job FAILED
  ↓
BFF returns to frontend: jobId, status: TRAINING
  ↓
Frontend polls for updates (with timeout handling)
  ↓
When complete: webhook notifies BFF
BFF updates model record with metrics
```

## Related Concepts

- [[async-job-processing]] — Jobs with timeout handling
- [[webhook-integration]] — Retry logic for webhooks
- [[jarvis-external-integrations]] — Applied in service integrations
- [[jarvis-model-training]] — Long-running flow these patterns protect

## Sources

- [[raw/jarvis/EXTERNAL-INTEGRATIONS.md]]

Retry, timeout, circuit-breaker and graceful-degradation patterns are general
knowledge. The specific timeout and retry values described for Roberto, Picasso and
Task Manager were inferred while writing the source document, not read from Jarvis
configuration — treat them as uncertain until verified against the code.
