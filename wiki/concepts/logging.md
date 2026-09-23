# Logging & Observability

## Definition
Recording errors and application behavior so production issues can be tracked and troubleshooted; in NestJS this starts with the built-in logger and can be extended with external libraries or a centralized logging service.

## Mental Model
A ship's logbook plus shore-based radio. Local entries tell you what happened on board; sending them to a central station means the whole fleet's incidents can be correlated in one place.

## Example
```bash
# Built-in NestJS logger is available by default;
# the source names Elasticsearch, Loggly and Datadog
# as centralized options for distributed applications.
```

## Related Concepts
- [[nestjs-deployment]]
- [[health-checks]]

## Sources
- [[raw/python/nestjs-deploy.md]]
