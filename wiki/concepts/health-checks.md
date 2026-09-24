# Health Checks

## Definition
A dedicated endpoint that can be queried regularly to verify a deployed application is running and responding as expected, so problems are caught before they become critical.

## Mental Model
A pulse monitor on a patient. Nobody needs to examine the whole body (the app) — a single signal says whether the heart is still beating, and the monitor can raise an alarm when it isn't.

## Example
```bash
# In NestJS, health checks are implemented with:
npm install @nestjs/terminus
```

## Related Concepts
- [[nestjs-deployment]]
- [[logging]]
- [[kubernetes-deployment]] — Liveness and readiness probes in a Deployment

## Sources
- [[raw/python/nestjs-deploy.md]]
