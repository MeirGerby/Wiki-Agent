# NestJS Deployment Guide

When you're ready to deploy your NestJS application to production, there are key steps you can take to ensure it runs as efficiently as possible. This guide covers essential tips and best practices for deploying your NestJS application successfully.

If you'd rather not manage infrastructure yourself, Mau, our official deployment platform, gets you to production on AWS with a single command. Jump straight to Easy deployment with Mau, or read on for the underlying concepts that apply to any hosting choice.

Prerequisites
Before deploying your NestJS application, ensure you have:
- A working NestJS application that is ready for deployment.
- Access to a deployment platform or server where you can host your application.
- All necessary environment variables set up for your application.
- Any required services, like a database, set up and ready to go.
- Node.js 20.19 or later (22.12 or later on the 22.x line) installed on your deployment platform. Prefer a Node.js version that is still in active LTS.

Building your application
To build your NestJS application, compile your TypeScript code into JavaScript. This process generates a dist directory containing the compiled files. Build your application by running the following command:
$ npm run build

Production environment
Your production environment is where your application is accessible to external users. This could be a cloud-based platform like AWS (with EC2, ECS, etc.), Azure, or Google Cloud, or a dedicated server you manage, such as Hetzner.

NODE_ENV=production
While there's technically no difference between development and production in Node.js and NestJS, it's good practice to set the NODE_ENV environment variable to production when running your application in a production environment, because some libraries in the ecosystem behave differently based on this variable (e.g., enabling or disabling debugging output).

$ NODE_ENV=production node dist/main.js

Running your application
To run your NestJS application in production, use the following command:
$ node dist/main.js

Health checks
Health checks are essential for monitoring the health and status of your NestJS application in production. With a health check endpoint, you can regularly verify that your app is running as expected and respond to issues before they become critical. In NestJS, you can implement health checks with the @nestjs/terminus package.

Logging & Observability
Logging is essential for any production-ready application. It helps you track errors, monitor behavior, and troubleshoot issues. In NestJS, you can manage logging with the built-in logger, or opt for external libraries if you need more advanced features. For distributed applications, a centralized logging service such as Elasticsearch, Loggly, or Datadog is very useful.

Scaling up or out
Scaling your NestJS application effectively is crucial for handling increased traffic and ensuring optimal performance. There are two primary strategies for scaling: vertical scaling (scaling up - increasing resources of a single server) and horizontal scaling (scaling out - adding more server instances).
