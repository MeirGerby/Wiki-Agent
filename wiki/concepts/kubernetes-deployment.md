# Kubernetes Deployment Patterns

## Definition

The standard pattern for deploying containerized applications to Kubernetes: a **Deployment** manages a set of replicated Pods, a **Service** exposes the Pods to the network, and **ConfigMap** + optional **Secret** provide configuration and sensitive data. A **HorizontalPodAutoscaler** optionally auto-scales replicas based on metrics. **Helm charts** template these manifests for reuse across deployments.

## Mental Model

Imagine managing a restaurant kitchen. The Deployment is your kitchen staff (replicas/Pods) managed by a shift manager (the controller). The Service is the front-of-house counter where customers order (network entry point). The ConfigMap is your recipe book (configuration), the Secret is your vault of special ingredients (sensitive data). The HPA is your manager who hires/fires staff based on dinner rush demand (auto-scaling).

## Core Components

### Deployment

Manages a set of identical Pod replicas. Kubernetes automatically recreates Pods if they fail.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3                    # Start with 3 copies
  revisionHistoryLimit: 2        # Keep 2 old revisions for rollback
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: my-app:1.0.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

**Key decisions**:
- **Replicas**: How many Pods to run (overridden by HPA if enabled)
- **Image pull policy**: `IfNotPresent`, `Always`, `Never`
- **Resource requests**: What the app needs (used by scheduler)
- **Resource limits**: Maximum the app can use (hard cap, terminated if exceeded)

### Service

Exposes Pods to the network. Routes traffic to Pods with matching labels.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  type: ClusterIP          # Internal DNS only
  selector:
    app: my-app           # Route to Pods with this label
  ports:
    - port: 8080          # Expose on port 8080
      targetPort: 8080    # Forward to container port 8080
      protocol: TCP
```

**Service types**:
- **ClusterIP** (default): Internal DNS, in-cluster access only
- **LoadBalancer**: Exposes to outside world, provisions external IP
- **NodePort**: Exposes on a node port (32000-32767)

### ConfigMap

Non-sensitive configuration data (API endpoints, feature flags, etc.).

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app-config
data:
  DATABASE_URL: postgres://db:5432/mydb
  LOG_LEVEL: info
```

Mounted via `envFrom` in Deployment:
```yaml
envFrom:
  - configMapRef:
      name: my-app-config
```

### Secret

Sensitive data (passwords, API keys, certificates). Same structure as ConfigMap but base64-encoded.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-app-secret
type: Opaque
data:
  DB_PASSWORD: base64-encoded-password
```

**Important**: Base64 encoding is NOT encryption. Use Sealed Secrets or external secret managers for production.

### HorizontalPodAutoscaler (HPA)

Automatically scales replicas based on CPU or memory usage.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70    # Scale up if >70% utilized
```

**Gotcha**: Memory scaling is tricky. Node heaps don't shrink after spikes, so memory-based scaling can lock at high replica counts. Usually better to leave memory targets off and set request/limit ratios carefully.

## Helm Charts

**Helm** is a package manager for Kubernetes that templates the above manifests for reuse.

### Structure

```
charts/app/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default configuration values
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── hpa.yaml
│   ├── _helpers.tpl        # Reusable template functions
│   └── NOTES.txt           # Post-install instructions
└── .helmignore             # Files to exclude
```

### values.yaml Pattern

Default values that can be overridden at install time:

```yaml
image:
  registry: docker.io
  repository: my-org/my-app
  tag: 1.0.0
  pullPolicy: IfNotPresent

replicas: 1

autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 6
  targetCPUUtilizationPercentage: 70

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

secret:
  enabled: false     # Create Secret if true
```

### Templating

Helm uses Go templating to generate Kubernetes manifests:

```yaml
# deployment.yaml template
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels:
    app: {{ .Chart.Name }}
spec:
  replicas: {{ .Values.replicas }}
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
```

Install with custom values:

```bash
helm install my-release ./charts/app \
  --set image.tag=2.0.0 \
  --set replicas=3 \
  --set autoscaling.enabled=true
```

## Common Patterns

### Stateless Web Service

```yaml
- Deployment: replicas (usually 2+)
- Service: ClusterIP + Ingress for HTTP
- ConfigMap: App config
- HPA: CPU-based scaling
- No Secret (keep creds in environment or secret manager)
```

### Stateful Service (Database)

```yaml
- StatefulSet (not Deployment): preserves identity
- Headless Service: DNS per Pod
- PersistentVolume: durable storage
- No HPA (stateful services don't scale like web services)
```

## Practical Example: Deploying Across Environments

Using Helm, you can deploy the same app to development, staging, and production with different configurations:

### Development (1 replica, minimal resources)

```bash
helm install jarvis-dev ./charts/app \
  --set image.tag=dev-latest \
  --set replicas=1 \
  --set resources.requests.memory=128Mi \
  --set resources.limits.memory=256Mi \
  --set autoscaling.enabled=false
```

### Staging (2 replicas, auto-scaling)

```bash
helm install jarvis-staging ./charts/app \
  --set image.tag=v1.0.0 \
  --set replicas=2 \
  --set resources.requests.memory=256Mi \
  --set resources.limits.memory=512Mi \
  --set autoscaling.enabled=true \
  --set autoscaling.minReplicas=2 \
  --set autoscaling.maxReplicas=4
```

### Production (3+ replicas, full auto-scaling, secrets enabled)

```bash
helm install jarvis-prod ./charts/app \
  --set image.tag=v1.0.0 \
  --set replicas=3 \
  --set resources.requests.memory=512Mi \
  --set resources.limits.memory=1Gi \
  --set autoscaling.enabled=true \
  --set autoscaling.minReplicas=3 \
  --set autoscaling.maxReplicas=10 \
  --set autoscaling.targetCPUUtilizationPercentage=70 \
  --set secret.enabled=true
```

### Better Practice: Separate Values Files

Instead of long command-line flags, create environment-specific values files:

**values-dev.yaml:**
```yaml
image:
  tag: dev-latest
replicas: 1
resources:
  requests:
    memory: 128Mi
autoscaling:
  enabled: false
secret:
  enabled: false
```

**values-prod.yaml:**
```yaml
image:
  tag: v1.0.0
replicas: 3
resources:
  requests:
    memory: 512Mi
autoscaling:
  enabled: true
  maxReplicas: 10
secret:
  enabled: true
```

Then deploy simply:

```bash
helm install jarvis-dev ./charts/app -f values-dev.yaml
helm install jarvis-prod ./charts/app -f values-prod.yaml
```

**Key benefit**: One template (`deployment.yaml`), infinite configurations.

## Installing from CI

An automated deploy needs flags an interactive one can skip, because nobody is
watching to clean up after a failure:

```bash
helm upgrade --install "$RELEASE" charts/app   --namespace jarvis   --set image.registry="$DOCKER_TEAM_REGISTRY"   --set image.repository="jarvis-$RELEASE"   --set image.tag="$CI_COMMIT_SHA"   --set secret.enabled="$SECRET"   --set autoscaling.enabled=true   --atomic   --cleanup-on-fail   --timeout 10m
```

| Flag | Effect |
|---|---|
| `upgrade --install` | Upgrade if the release exists, install if not — one idempotent command for both cases |
| `--atomic` | Roll back to the previous revision if the upgrade fails, instead of leaving a half-applied release |
| `--cleanup-on-fail` | Delete resources the failed upgrade newly created |
| `--timeout 10m` | How long to wait for resources to become ready before calling it a failure |

`--atomic` is the important one. Without it a failed upgrade leaves the release
wedged between two revisions, and the next deploy starts from that broken state.
With it, a failure is a no-op.

Note that `--atomic` implies waiting for readiness, so it only behaves as intended
if the pods have working probes — see [[health-checks]]. A Deployment with no
readiness probe reports ready immediately and a broken rollout can still be
recorded as a success.

`image.tag` is set to the commit SHA rather than a moving tag like `latest`, so a
release always names the exact image it deployed and a rollback is unambiguous. See
[[kaniko-builds]] for where that tag comes from.

## Related Concepts

- [[scaling]] — Horizontal vs vertical scaling decisions
- [[health-checks]] — Liveness and readiness probes (part of Deployment)
- [[nestjs-deployment]] — Application deployment practices
- [[ci-pipeline]] — The pipeline stage that runs this Helm command
- [[kaniko-builds]] — How the deployed image is built and tagged
- [[q-helm-multi-env]] — Q&A: deploying one chart to several environments

## Sources

- [[raw/jarvis/charts/app/Chart.yaml]]
- [[raw/jarvis/charts/app/values.yaml]]
- [[raw/jarvis/charts/app/templates/deployment.yaml]]
- [[raw/jarvis/charts/app/templates/service.yaml]]
- [[raw/jarvis/charts/app/templates/hpa.yaml]]
- [[raw/jarvis/gitlab/ci/deploy.yml]]

Helm flag semantics (`--atomic`, `--cleanup-on-fail`, `--timeout`) and the
readiness-probe caveat are general knowledge; the deploy file sets the flags
without commentary.
