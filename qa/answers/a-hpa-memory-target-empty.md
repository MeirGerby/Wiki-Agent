---
id: a-hpa-memory-target-empty
question: q-hpa-memory-target-empty
concepts:
  - kubernetes-deployment
  - scaling
origin: generated
---

# A Node heap does not shrink after a spike

## Short answer

Scaling on memory would add replicas during a spike and then never remove them, because the heap stays large after the load passes. The chart leaves the metric out on purpose.

## What the chart says

`values.yaml` documents the reasoning inline, next to the empty value: both
targets are a percentage of the resource **request**, an empty value drops that
metric, and memory is off by default for exactly this reason.

```yaml
autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 6
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: ''   # deliberately empty
```

## The related detail in the Deployment

When autoscaling is on, the Deployment stops declaring `replicas` at all:

```yaml
{{- if not .Values.autoscaling.enabled }}
replicas: {{ .Values.replicas }}
{{- end }}
```

Otherwise the Deployment and the HorizontalPodAutoscaler would both own the same
field and fight over it.

## If you do want memory scaling

Size requests and limits carefully first, and expect scale-down to be driven by
CPU falling rather than by memory returning.

## Sources

- [[raw/jarvis/charts/app/values.yaml]]
- [[raw/jarvis/charts/app/templates/deployment.yaml]]
- [[raw/jarvis/charts/app/templates/hpa.yaml]]

## Question

- [[q-hpa-memory-target-empty]]

## Related Concepts

- [[kubernetes-deployment]]
- [[scaling]]
