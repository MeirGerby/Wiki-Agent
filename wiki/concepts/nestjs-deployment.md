# NestJS Deployment

## Definition
The process of taking a NestJS application from local development to a production environment where external users can access it: compile TypeScript to JavaScript, configure the environment, and run the compiled output on a server or platform.

## Mental Model
Think of a bakery moving from a test kitchen to a shop. You don't ship raw dough (TypeScript) — you bake it once (`npm run build` → `dist/`), set the shop's conditions (`NODE_ENV=production`), then open the doors by running the finished product (`node dist/main.js`).

## Example
```bash
npm run build
NODE_ENV=production node dist/main.js
```

## Notes & Uncertainties
- Prerequisites listed by the source: a working app, a host/platform, environment variables, supporting services (e.g. database), and Node.js 20.19+ (22.12+ on the 22.x line), preferring an active LTS release.
- The source mentions "Mau", described as the official NestJS deployment platform that deploys to AWS with one command, and says the concepts apply to any hosting choice (AWS EC2/ECS, Azure, GCP, or a dedicated server such as Hetzner). This is vendor-specific guidance from the source, not a general requirement.
- The source claims there is "technically no difference" between development and production in Node.js/NestJS, yet still recommends setting `NODE_ENV=production` because some libraries branch on it. This tension is kept as stated.

## Related Concepts
- [[node-env]]
- [[health-checks]]
- [[logging]]
- [[scaling]]

## Sources
- [[raw/python/nestjs-deploy.md]]
