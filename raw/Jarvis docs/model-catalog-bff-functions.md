# model-catalog BFF: functions reference

`apps/model-catalog/bff/src` is a tRPC backend built on the shared `@jarvis/bff` package. It uses Awilix for dependency injection and Drizzle for the database.

- Reads go straight to the database.
- Writes go through three HTTP services: **Roberto** (all catalog writes), **Picasso** (tagging classes) and **Task Manager** (model training).
- The web app imports `AppRouter` from here as a type.

This covers every non-spec source file under `src/`, except the test helpers in `src/test/`.

## Bootstrap

### `main.ts`, `server.ts`
- `main.ts` creates the container and builds the Hono app with `createBffApp`, giving it the `appRouter`. It exports both.
- `server.ts` starts the server with `serveBff` and disposes the container on shutdown.

### `server-env.ts`
- `loadServerEnv(source)`: validates environment variables with zod. The base BFF variables plus `ROBERTO_BASE_URL`, `PICASSO_URL`, `TASK_MANAGER_URL` and an optional `OTHER_CATEGORY_KEY`.

### `web-env.ts`
- `loadWebEnv(source)`: validates the settings that are sent to the browser:
  - ADFS on/off and the maximum login attempts (default 3).
  - Sensor-group labels and allowed resolutions.
  - Area labels, the area singular/plural words, the pinned area and the resolution unit.

### `container.ts`
- `createAppContainer()`: creates the Awilix container. It registers the base BFF pieces, both configs, and the five singletons: `permissionsService`, `catalogService`, `robertoService`, `picassoService` and `taskManagerService`. Also defines the `Cradle` type.

### `router.ts`
- `appRouter`: the root tRPC router with `catalog`, `auth`, `permissions`, `webConfig` and `logger`.

### `trpc.ts`
- `router`, `publicProcedure`, `authedProcedure`: re-exported from the shared tRPC setup.
- `roleProcedure(minimum)`: creates a procedure that resolves the caller's role through `PermissionsService`.
  - Throws FORBIDDEN (Hebrew message) if the role is below `minimum`.
  - Otherwise puts `{ user, role }` into the context.

## auth/

### `session-user.ts`
- `SessionUser`: the base session user schema extended with `role`.
- `toSessionUser(user, cradle)`: builds the session user from a database user, resolving the role from permissions.

## web-config/

### `web-config.router.ts`
- `webConfig.get`: public query. Returns the validated web config to the browser.

## permissions/

### `permissions.router.ts`
All procedures require admin or above.
- `list`: returns all permissions.
- `set`: creates or updates a permission.
- `remove`: deletes a permission.

### `permissions.service.ts`
- `toRole(value)`: parses a stored role string, falling back to `DEFAULT_ROLE` if it is invalid.
- `assertCanManageRole(actorRole, role)` (private): throws FORBIDDEN if the actor is not a superadmin and the role is above viewer.
- `resolveRole(userId, hierarchy)`: finds the user's effective role.
  - A direct per-user grant wins.
  - Otherwise the grant on the deepest matching hierarchy path wins.
  - Otherwise `DEFAULT_ROLE`.
- `list()`: returns all permissions, joined with the user's display name and ordered by type and subject.
- `set(actorUserId, actorRole, input)`: upserts a permission.
  - The actor must be allowed to manage the new role.
  - You can't change your own permission.
  - A user subject must exist.
  - A non-superadmin can't overwrite an existing higher role.
- `remove(actorUserId, actorRole, input)`: deletes a permission. It fails if the permission doesn't exist, if it's your own, or if the actor can't manage its role.

## roberto/ (client for the service that owns catalog writes)

### `roberto.utils.ts`
- `toRobertoError(error)`: converts an Axios error into a `TRPCError`. Uses the response message with BAD_REQUEST, or a generic INTERNAL_SERVER_ERROR if there was no response. Non-Axios errors pass through.

### `roberto.service.ts`
`RobertoService`'s constructor creates the Axios client and installs `toRobertoError` as the error interceptor. Each method mirrors one Roberto route:
- `createObject(body)`: uploads a new object as a multipart form (JSON plus image). Returns the image URL.
- `getActiveSqrule(englishName)`: gets the active version of a model.
- `getGeographyByName(name)`: gets an area, or `undefined` on a 404.
- `createRule(body)`: creates a rule.
- `createSqrule(body)`: creates a model.
- `createSqruleVersion(englishName, body)`: creates a new version of a model and returns the version number.
- `changeActivationStatus(englishName, version, lastUpdateUser)`: activates the given version.

## picasso/ (client for tagging classes)

### `picasso.utils.ts`
- `toDuplicateError(className)`: creates the "class appears twice" error.
- `toTaggingClasses(items)`: throws if any class name is duplicated. Otherwise returns only `className` and `hebrewName`.

### `picasso.service.ts`
- `getTaggingClasses()`: fetches the list. Throws INTERNAL_SERVER_ERROR (Hebrew message) if the request fails or the response shape is invalid.

## task-manager/ (client for model-training tasks)

### `task-manager.utils.ts`
- `toTrainingStatus(missionStatus)`: maps "Not Started", "Running" and "Error" to the internal status values. Anything else becomes `undefined`.
- `toTrainingMission(mission, now)`: converts a task-manager mission into an internal training mission.
  - Drops missions with an unknown status.
  - Drops failed missions older than 2 days.
  - Normalizes the creation time to ISO.
- `messageForErrorCode(errorCode)`: maps a task-manager error code to a Hebrew message. Unknown codes get "שגיאה לא ידועה".

### `task-manager.service.ts`
The client uses a 10-second timeout.
- `createTask(body)`: sends a model-creation task and logs success or failure.
- `getTrainingModels(objectName)`: gets the training missions for an object and converts them. Throws a generic error if the call or parsing fails.
- `abortTraining(missionId)`: aborts a mission and logs the result.
- `toTRPCError(error)` (private): turns an Axios error into BAD_REQUEST with a mapped message, and anything else into INTERNAL_SERVER_ERROR.

## catalog/

### `catalog.router.ts`
- `parseCreateObjectForm(form)`: validates the multipart request. It checks the `objectJson` field, the JSON syntax, the schema and the presence of a `file`. Each failure throws BAD_REQUEST with a Hebrew message.
- Procedures:
  - Any logged-in user: `categories`, `geographies`, `sensorGroups`, `taggingClasses`.
  - Guest or above: `objects`, `objectCount`, `object`.
  - Admin or above: `createObject`, `updateModel`, `cloneModel`, `createModel`, `trainingModels`, `abortModelTraining`.
  - Each one delegates to `CatalogService`.

### `catalog.utils.ts`
- `StoredPerformanceRate` and `StoredSqruleConfig`: zod schemas for the JSON stored on a model (precision, recall and recommended threshold; depth and dexter thresholds). They tolerate invalid values.
- `formatConfigRecord(record)`: turns a record of JSON values into strings, using `JSON.stringify` for non-strings.
- `toModelPerformance(stored)`: converts stored performance data to the API shape, with missing values as `null`.
- `applyPerformanceRate(stored, performance)`: merges an update into the stored performance. Fields not provided keep their old value.
- `buildRuleName({ sensorGroup, geographyName, minResolution, maxResolution })`: joins the defined parts with `-` to make the rule name.
- `sortCategories(categories, otherKey)`: sorts categories by Hebrew name, with the "other" category last.
- `toTrainingModels(missions, creatorNames)`: converts missions to training models, replaces the creator ID with a display name when known, and sorts by newest first.
- `operationalStatusOf(raw)`: returns OPERATIONAL only for `'OPERATIONAL'`, otherwise EXPERIMENTAL.
- `GuestVisibility` and `FullVisibility`: the two visibility strategies.
  - Guests see only active, operational models. Empty objects are hidden, and the status is not exposed.
  - Everyone else sees all active models with their operational status. Empty objects are shown.
  - Each has `modelCondition`, `hidesEmptyObjects` and `decorateModel`.
- `visibilityStrategyFor(role)`: picks the strategy for a role.
- `mergeGeographies(areas)`: merges several areas into one MultiPolygon, sorted by name, with a combined name.

### `catalog.service.ts`
Public methods:
- `categories()`: reads the categories, warns once if `OTHER_CATEGORY_KEY` matches nothing, and returns them sorted.
- `geographies()`: lists areas that have a configured label.
- `sensorGroups()`: lists sensor groups by name.
- `taggingClasses()`: gets the tagging classes from Picasso, sorted by Hebrew name.
- `objects(filter, role)`: returns one page of objects.
  - Applies category, area, search and visibility filters.
  - Pages by cursor on the English name.
  - Counts distinct visible models per object.
  - Returns the total only on the first page.
  - An empty filter list returns an empty page.
- `objectCount(role)`: counts the objects visible to the role.
- `createObject(input, image, createUser)`: checks the English and Hebrew names aren't taken (CONFLICT `english_name_taken` or `hebrew_name_taken`), then creates the object through Roberto.
- `updateModel(input, lastUpdateUser)`: fetches the active model, merges the performance changes, creates a new version in Roberto, and activates it.
- `cloneModel(input, createUser)`:
  - Fetches the source model.
  - Checks the area exists (a combined area is not created here).
  - Builds the rule name and creates the rule if missing.
  - Creates the new model as EXPERIMENTAL, copying the source's config.
  - Activates version 1.
- `createModel(input, creatingUserName)`: ensures the area (creating a combined one is allowed), ensures the rule, then submits a training task to the task manager.
- `trainingModels(input)`: gets the training missions for an object, looks up creator display names in the database, and returns them.
- `abortModelTraining(input)`: aborts the mission through the task manager.
- `object(input, role)`: returns one object with its models.
  - Throws NOT_FOUND if the object is missing or inactive.
  - Also throws NOT_FOUND for a guest when the object has no visible models.
  - Models are sorted with operational first, then newest, then detection order.
  - Each model includes performance, sensors, area, resolution, depth/dexter thresholds and last editor.

Private helpers:
- `visibleObjectCondition(strategy)`: active objects, and for guests only those with at least one visible model.
- `objectNamesWithModel(strategy, term?)`: sub-query of object names that have a visible model, optionally matching the term.
- `modelNameCondition(term)`: case-insensitive match on a model's English or Hebrew name.
- `objectSearchCondition(term, strategy)`: matches the object's names or any of its models' names.
- `objectNamesInGeographies(names, strategy)`: sub-query of objects that have a visible model in any of the given areas. A combined area counts if any of its parts matches.
- `ensureGeography(names, { canCreate })`:
  - Returns `undefined` for no names.
  - For one name, checks that it exists.
  - For several, returns the combined name if it already exists.
  - Otherwise, if creation is allowed, builds a merged area from the parts and returns it as `newGeography`.
  - Throws NOT_FOUND or BAD_REQUEST on failure.
- `geographyExists(name)`: checks the area table.
- `ensureRule(rule)`: creates the rule through Roberto if it doesn't exist yet, and logs it.
- `fetchActiveSqrule(id)`: gets the active model from Roberto, throws NOT_FOUND if there isn't one.
- `geographyNotFound()` (module-level): builds the "area not found" error.
