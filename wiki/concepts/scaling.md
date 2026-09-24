# Scaling

## Definition
Two strategies for handling increased traffic: vertical scaling (scaling up — adding resources to a single server) and horizontal scaling (scaling out — adding more server instances).

## Mental Model
Scaling up is buying a bigger truck; scaling out is buying more trucks of the same size. One bigger truck is simpler to drive, but a fleet keeps moving if one truck breaks down.

## Example
```bash
# Scaling out with a NestJS app means running additional instances:
NODE_ENV=production node dist/main.js   # run on each server
```

## Notes & Uncertainties
- The source introduces both strategies but the material ends before giving guidance on choosing between them.

## Related Concepts
- [[nestjs-deployment]]
- [[health-checks]]
- [[kubernetes-deployment]] — Horizontal scaling via HorizontalPodAutoscaler

## Sources
- [[raw/python/nestjs-deploy.md]]
