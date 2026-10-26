# libs/bff: functions reference

`libs/bff` (`@jarvis/bff`) is the shared backend toolkit that apps like `model-catalog-bff` build on. It provides:

- a Hono app with health/readiness endpoints, request logging, an ADFS login stub and a tRPC mount;
- an Awilix container with the database, logger and auth services;
- tRPC setup with cookie-based auth;
- ready-made `auth` and `logger` routers.

`src/index.ts` is the public entry point. It re-exports `createBffApp`, `createBaseBffRegistrations`, `createBffContainer`, `BaseCradle`, `baseServerEnv`, `BooleanStringSchema`, `jsonRecordEnv`, `serveBff`, `createTrpc`, `createAuthRouter`, `BaseSessionUser`, `toBaseSessionUser` and `createLoggerRouter`.

This covers every non-spec file under `src/`. `dist/` is build output and is not described.

## server/

### `server/env.ts`
- `BooleanStringSchema`: zod schema that turns an environment string into a boolean (`"true"` is true, anything else is false).
- `jsonRecordEnv(value)`: builds a schema for an environment variable that holds a JSON object. A missing variable becomes `{}`. The parsed JSON is validated as a string-keyed record of the given value schema.
- `AuthEnvSchema` (internal): the auth-related variables: `NODE_ENV`, `JWT_SECRET`, `MAX_COOKIE_SIZE`, `USER_ID`, `DISABLE_ADFS_AUTH`, `ADFS_PRODUCTION_URL` and the four `ADFS_STUB_*` values.
- `BaseServerEnvSchema` (exported as `baseServerEnv`): the auth variables plus:
  - `PORT` (default 8080).
  - `LOG_LEVEL` (default `info`).
  - `LOGSTASH_URL`, which must look like `tcp://host:port`.
  - `SERVICE_ENVIRONMENT` and `SERVICE_VERSION`.
  - `DATABASE_URL` and `DATABASE_SSL`.
  - Empty optional strings become `undefined`.

### `server/container.ts`
- `BaseCradle`: the shared dependency shape: `config`, `logger`, `db`, `authService`, `usersService`. Apps extend it with their own services.
- `createBffContainer()`: creates an Awilix container in strict proxy-injection mode.
- `createBaseBffRegistrations(config, project)`: returns the registrations every app needs.
  - Config as a value.
  - A singleton logger built from the config, closed on disposal.
  - A singleton database connection (pool of 10).
  - Singleton `AuthService` and `UsersService`.

### `server/app.ts`
- `rootCause(error)` (internal): follows the `cause` chain to the innermost error, so logs show the real failure.
- `createBffApp({ project, container, router })`: builds the Hono app.
  - Adds the cookie-jar middleware.
  - `/health` returns "ok", and `/ready` returns "ok" only if `select 1` works on the database (otherwise 503). Both are registered before the request logger so probes aren't logged.
  - A request-logging middleware records method, path, status and duration in nanoseconds.
  - `/api/adfs` serves the ADFS login handler.
  - `/trpc/*` mounts the tRPC router with the shared context. The `onError` handler logs only internal server errors that have a cause, with the root error, the procedure name and its type.

### `server/serve.ts`
- `serveBff(app, project, onShutdown)`: starts the Node HTTP server on `PORT` (default 8080).
  - `gracefulShutdown` (internal) runs on SIGINT/SIGTERM. It closes the server, runs `onShutdown`, and exits 0. After 10 seconds it forces exit 1.

## trpc/

### `trpc/trpc.ts`
- `createTrpcContext(container)`: returns the context factory for the tRPC adapter. For each request it:
  - creates a scoped container (`cradle`);
  - reads the session ID header;
  - reads the auth cookie and decodes it into `user` through `authService.parseAuthToken`.
  - The context is `{ cradle, sessionId, honoContext, user }`.
- `createTrpc()`: initializes tRPC with that context and returns `{ router, publicProcedure, authedProcedure }`.
  - The error formatter hides the message of internal errors that have a cause, replacing it with "Internal server error".
  - `authedProcedure` uses the internal `isAuthed` middleware, which throws UNAUTHORIZED when there is no user.
- `Trpc<C>`: the return type of `createTrpc`, used by the router factories.

## auth/

### `auth/jwt.ts`
- `generateJwt(secret, data, options)`: signs a JWT with a 24-hour expiry by default.
- `decodeJwt(secret, token)`: verifies a JWT and returns its payload, or `undefined` if invalid or expired.

### `auth/cookies.ts`
- `cookieJar()`: Hono middleware. It gives each request a list of cookies to set, then writes them all as `Set-Cookie` headers after the handler runs.
- `jarOf(c)` (internal): gets that list from the request, throwing a clear error if the middleware wasn't installed.
- `setCookie(c, { maxCookieSize, isProduction }, key, value)`: adds an HttpOnly, SameSite=Lax, 30-day cookie. It is Secure in production. If the value is at least `maxCookieSize` long, it is silently not set.
- `AUTH_COOKIE_KEY`: the cookie name, `auth-token`.

### `auth/session.ts`
- Schemas and types:
  - `AuthTokenUser`: the data stored in the JWT (`id`, `userId`, `hierarchy`).
  - `SigninInput`: the optional sign-in fields (`userId`, `email`, `fullName`, `hierarchy`, `displayName`), each validated when present.
  - `BaseSessionUser`: the user fields exposed to clients, derived from the `users` table schema.
- `toBaseSessionUser(user)`: copies those fields from a database user.

### `auth/auth.service.ts`
- `generateAuthToken(user)`: creates the JWT for a user with the configured secret.
- `parseAuthToken(token)`: verifies and decodes a token, then validates its shape. Returns `undefined` if anything is wrong.
- `signin(c, input)`: signs a user in.
  - Uses the given `userId`, or the configured `USER_ID` when ADFS is disabled. Throws BAD_REQUEST if neither exists.
  - Creates or updates the user through `UsersService`, sets the auth cookie, and returns `{ user, isNewUser, wasUpdated }`.
  - Database failures are logged and become INTERNAL_SERVER_ERROR.
- `me(id)`: finds the user by ID.

### `auth/auth.router.ts`
- `createAuthRouter(trpc, { sessionUser, toSessionUser })`: builds the `auth` router. Each app supplies its own session user schema and a converter, for example one that adds the role.
  - `signin` (public mutation): signs in and returns the converted user, `isNewUser` and `wasUpdated`.
  - `me` (authed query): returns the current user converted, or `null` if the user no longer exists.

### `auth/adfs.ts`
- `adfsLogin(config, logger)`: returns the handler for `/api/adfs`.
  - In production with `ADFS_PRODUCTION_URL` set, it redirects to that URL.
  - Otherwise it returns a small HTML page that posts a stub success message and user (from the `ADFS_STUB_*` and `USER_ID` config) to the opener window. This is the local and dev login.

## users/

### `users/users.service.ts`
- `createNewUserIfNecessary(userId, fields)`: finds the user by `userId`.
  - If the user exists, it updates only the fields that were provided and have changed (email, full name, hierarchy, display name), and sets `updatedAt`. It returns the user with `wasUpdated` true or false.
  - If not, it inserts a new user and returns it with `isNewUser` true.
- `findById(id)`: returns the user with that ID, or `null`.

## logging/

### `logging/logger.router.ts`
- `relayLog(ctx, input)` (internal): forwards one browser log entry to the server logger, tagged with the session ID and user ID.
- `createLoggerRouter(trpc)`: builds the `logger` router. Both procedures are public, so logs can be sent before login.
  - `log`: relays a single entry.
  - `logBatch`: relays each entry in a list. The web app uses this one.
