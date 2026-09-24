---
id: a-helm-multi-env
question: q-helm-multi-env
concepts:
  - kubernetes-deployment
answered: 2026-09-24
origin: asked
---

# One chart, many environments

## Short answer

The chart is a template. `values.yaml` holds defaults, and each environment
overrides only what differs. There is one copy of the manifests, not three.

## How it works

`charts/app/templates/deployment.yaml` never hardcodes a replica count — it
reads one:

```yaml
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicas }}
  {{- end }}
```

Note the guard: when autoscaling is on, the Deployment stops declaring a replica
count at all, so the HorizontalPodAutoscaler owns it. Two controllers fighting
over the same field is the bug this avoids.

## Per-environment values files

Rather than long `--set` chains, keep one file per environment:

```yaml
# values-dev.yaml
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

```yaml
# values-prod.yaml
image:
  tag: v1.0.0
replicas: 3
resources:
  requests:
    memory: 512Mi
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
secret:
  enabled: true
```

Then:

```bash
helm install jarvis-dev  ./charts/app -f values-dev.yaml
helm install jarvis-prod ./charts/app -f values-prod.yaml
```

## What differs between environments

| | Dev | Staging | Prod |
|---|---|---|---|
| Replicas | 1 | 2 | 3 |
| Memory request | 128Mi | 256Mi | 512Mi |
| Autoscaling | off | 2–4 | 3–10 |
| Secret | off | off | on |

## One caveat from the chart

`values.yaml` leaves `targetMemoryUtilizationPercentage` empty on purpose, and
says why: a Node heap does not shrink after a spike, so a memory target scales
up and never back down. CPU is the safer metric here.

## Sources

- [[raw/jarvis/charts/app/values.yaml]]
- [[raw/jarvis/charts/app/templates/deployment.yaml]]
- [[raw/jarvis/charts/app/templates/hpa.yaml]]

The three-environment split above is an illustration of the pattern. Jarvis
ships `values.yaml` only — no per-environment files exist in the repo yet.

## Question

- [[q-helm-multi-env]]

## Related Concepts

- [[kubernetes-deployment]]
