# NODE_ENV

## Definition
An environment variable that tells the runtime which mode the application is running in; in production it is set to `production`.

## Mental Model
A label taped to the outside of a crate. The crate contents are the same, but warehouse workers (libraries in the ecosystem) read the label and behave differently — turning off debug output, stricter checks, and so on.

## Example
```bash
NODE_ENV=production node dist/main.js
```

## Notes & Uncertainties
- The source states Node.js and NestJS themselves behave identically in development and production; the variable matters because third-party libraries inspect it.
- Setting it is described as "good practice", not a hard requirement.

## Related Concepts
- [[nestjs-deployment]]

## Sources
- [[raw/python/nestjs-deploy.md]]
