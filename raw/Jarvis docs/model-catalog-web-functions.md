[[# model-catalog web: functions reference]]

`apps/model-catalog/web/src` is a React SPA served by a small Hono server. It uses TanStack Router, TanStack Query, tRPC and TanStack Form. UI text is Hebrew and the layout is right-to-left.

This covers every `.ts` and `.tsx` file except the generated `routeTree.gen.ts`. Anonymous callbacks are described under the function that owns them.

## App bootstrap

### `main.tsx`
- `pathFromKey(key)`: turns a React Query key like `[['catalog','objects']]` into `"catalog.objects"` for log entries. Returns `"unknown"` if the key has no array path.
- `shouldRetry(failureCount, error)`: query retry rule. Never retries tRPC errors with an HTTP status below 500, and retries other errors up to 2 times.
- `InnerApp()`: the gate before the router.
  - Shows a spinner while auth or config is loading.
  - Shows an error screen if config failed to load, if ADFS failed too many times (with a retry button), or if the user is not authenticated.
  - Otherwise renders `RouterProvider`.

### `server.ts`
- `gracefulShutdown()`: closes the HTTP server on SIGINT/SIGTERM and exits. Forces exit with code 1 after 10 seconds.
- The file also registers `/health` and `/ready`, long-caches `/assets/*`, and falls back to `index.html` for client routes.

### `router-context.ts`
Only declares the `RouterContext` type (auth, queryClient, trpc). No functions.

## lib/

### `adfs.ts`
- `fetchADFSUser()`: opens the ADFS login popup and waits for its `postMessage`.
  - On success it resolves with a normalized `AppUser`.
  - It rejects if the popup is blocked, if the message says failure, or if the user closes the popup (a 5-second poll detects this).
  - Inner `cleanup` removes the listener and the interval.
  - Inner `authMessageEventHandler` validates the message with zod and builds the user.

### `error-message.ts`
- `readableMessage(message)`: extracts the first message when the error text is a JSON array of zod issues. Otherwise returns the text unchanged.
- `hebrewErrorMessage(error)`: returns a Hebrew message for display. Keeps the text if it already contains Hebrew, otherwise maps the tRPC error code to a Hebrew message, with a generic fallback.

### `form-errors.ts`
- `firstMessage(errors)`: returns the first usable message from TanStack Form's mixed error list (a string, an `Error`, or an object with `.message`). Returns `undefined` if there is none.

### `log.ts`
- `toSnakeCase(key)`: converts camelCase to snake_case, used for `jarvis.*` log fields.
- `createLogger(sendBatch)`: builds a buffered logger and returns `{ logInfo, logWarn, logError }`. Internally:
  - `clearFlushTimer` cancels the pending flush timer.
  - `flush` sends the buffer as one batch and ignores send failures.
  - `enqueue` adds an entry. Flushes at once on an error or when the buffer reaches 20 entries, otherwise within 5 seconds.
  - `write` builds the structured log entry with timestamp, `event.action`, extra fields and error details.

### `roles.ts`
Only exports Hebrew label constants for roles and permission subject types.

### `trpc.ts`
- `createId()`: generates a UUID.
- `getSessionId()`: reads the session ID from `sessionStorage`, creating and saving one if missing.
- `headers()`: attaches the session ID header to every request.
- `trpcClient`: sends file uploads (non-JSON input) through `httpLink` and everything else through `httpBatchLink`.

## context/

### `auth-context.tsx`
- `AuthProvider`: runs the whole login flow. Queries `auth.me` and, if there is no session, starts a login automatically. Inside it:
  - `onAttemptSuccess` / `onAttemptFailure`: clear the in-flight flag and the popup state, then reset or increment `failedAttempts`.
  - `handleADFSLogin`: opens the popup via `fetchADFSUser`, then calls the `auth.signin` mutation with the returned user. If the popup fails, logs and counts a failure.
  - `startLogin`: skips if a login is already running. If `DISABLE_ADFS_AUTH` is set it signs in without ADFS, otherwise it uses the popup.
  - `startLoginFromEffect`: effect-safe wrapper that logs and then calls `startLogin`.
  - `handleRetryLogin`: resets the failure counter and starts a login.
  - Two effects log when attempts are exhausted and auto-trigger login when nothing else is in progress.
  - Exposes `{ user, isLoading, isAuthenticated, isNewUser, hasAuthError, failedAttempts, maxLoginAttempts, retryLogin }`.
- `useAuth()`: reads the auth context, throws if used outside the provider.

### `config-context.tsx`
- `ConfigProvider`: fetches the server's web config (`webConfig.get`) and provides `{ appConfig, isLoading, error }`.
- `useConfigContext()`: reads that context, throws if missing.
- `useGeographyTerms()`: returns the singular and plural names for the "area" concept, from config or the defaults "אזור" / "אזורים".

### `logger-context.tsx`
- `LoggerProvider`: provides the logger instance.
- `useLogger()`: reads it, throws if missing.

## Shared hooks and components

### `hooks/use-catalog-sync.ts`
- `useCatalogSync()`: returns functions that refresh cached data after changes.
  - `modelUpdated`: refreshes the object query.
  - `modelCloned`: refreshes the object, the object list and the object count.
  - `objectCreated`: refreshes the object list and count.
  - `trainingModelsChanged`: refreshes the training models.
  - Inner helpers `invalidateObject`, `invalidateObjects`, `invalidateTrainingModels` do the actual invalidation.

### `hooks/use-sorted-geographies.ts`
- `sortGeographies(geographies, labels, pinned)`: sorts areas with the pinned one first, then by Hebrew label.
- `useSortedGeographies(geographies)`: memoized hook that applies it using labels and the pinned area from config.

### `components/bilingual-name.tsx`
- `BilingualName`: renders "Hebrew | English" with the English part left-to-right.
- `Highlighted`: wraps the first match of the search term in `<mark>`.

### `components/icon.tsx`
- `Icon`: draws an SVG as a CSS mask in the current text color, with optional accessibility label and tooltip.

### `components/search-input.tsx`
- `SearchInput`: search box with a magnifier icon. The label doubles as placeholder and aria-label.

### `components/theme-toggle.tsx`
- `applyThemeWithoutTransitions(isDark)`: switches the `dark` class with CSS transitions briefly disabled, so there is no flicker.
- `ThemeToggle`: sun/moon button. Applies the theme and saves the choice to `localStorage`, ignoring storage errors.

## Routes

- `routes/__root.tsx`
  - `RootLayout`: sets RTL direction, tooltip provider, toast container and devtools around the page.
  - The not-found component shows a "page not found" screen with a link to the catalog.
- `routes/index.tsx`
  - `beforeLoad`: redirects `/` to `/catalog`.
- `routes/catalog/route.tsx`
  - The loader prefetches categories, areas and the first page of objects using the URL search params.
  - Also keeps `q`, `categories` and `geographies` in the URL when navigating.
- `routes/catalog/index.tsx`
  - `EmptyModelPanel`: shows "pick an object from the list".
- `routes/catalog/objects.$objectId/route.tsx`
  - The loader prefetches sensor groups and loads the object. A NOT_FOUND error becomes the not-found screen.
  - `errorComponent`: shows a retry button that calls `router.invalidate()`.
- `routes/catalog/objects.$objectId/index.tsx` and `_admin/models.$modelName.edit.tsx`
  - Both render nothing. Their URLs only signal state, and the edit route's `:modelName` is read elsewhere.
- `routes/catalog/objects.$objectId/_admin/route.tsx`
  - `beforeLoad`: redirects to the object page unless the user is an admin or above.
- `routes/catalog/objects.$objectId/_admin/models.new.tsx`
  - The loader prefetches sensor groups, areas and tagging classes.
  - `CreateModelRoute`: loads them and renders `CreateModelModal`.
  - Inner `close`: navigates back to the object page.
- `routes/permissions.tsx`
  - `beforeLoad`: allows superadmins only.
  - The loader prefetches the permission list.
  - `PermissionsPage`: layout with a back button and the panel.

## features/catalog

### `hooks/use-catalog-data.ts`
- `CatalogSearchSchema`: zod schema for the URL search params. Trims `q` and accepts a single string or an array for the two list params.
- `resolveCategoryIds` / `resolveGeographyNames`: return the selected values sorted, or all values when the URL has no filter.
- `objectsQueryOptions(trpc, search)`: builds the infinite-scroll query for objects with the filters and the cursor.
- `useCatalogData()`: gathers everything the catalog page needs (categories, areas, objects, totals, loading/error flags). `loadMoreObjects` fetches the next page if there is one and none is in flight.

### `components/catalog-layout.tsx`
- `CatalogLayout`: the catalog page (header, object list, outlet for the model panel). Its handlers:
  - `setQuery`: writes the search text to the URL.
  - `toggleGeography` / `toggleCategory`: add or remove one value from the filter and log it. The area filter is cleared from the URL when all areas are selected.
  - `toggleAllGeographies` / `toggleAllCategories`: select everything or nothing.
  - `clearFilters`: resets the search and both filters.
  - `handleObjectCreated`: opens the new object and adds its category to the filter if needed.
  - An effect logs `search.run` or `search.empty` one second after results settle.
  - Also picks which empty-state message to show.

### `components/app-header.tsx`
- `AppHeader`: renders search, filters, a clear-filters link, the theme toggle, a permissions link (superadmin only), and the user name and role with a tooltip. Two effects:
  - Pressing `/` focuses the search box (`focusSearch` is its handler).
  - The typed text is debounced by 250 ms before it updates the URL, and the box resyncs when the URL changes elsewhere.
- `isTypingTarget(target)`: true when the focus is in an input, textarea, select or editable element, so `/` doesn't hijack typing.

### `components/category-filter.tsx`, `components/geography-filter.tsx`
- `CategoryFilter` / `GeographyFilter`: wrap `MultiSelectFilter` with their own options and Hebrew labels. The geography one sorts options and uses the configured labels and terms.

### `components/multi-select-filter.tsx`
- `MultiSelectFilter`: popover with a "select all" checkbox (with an indeterminate state) and a searchable option list.
- `summarize()`: makes the button text: "all", "none", the single selected label, or "N items".

### `components/create-object-modal.tsx`
- `conflictOf(error)`: maps a server error message to a field-level "name already exists" message.
- `buildRobertoForm(input, image)`: builds the `FormData` (JSON plus image file) for upload.
- `CreateObjectModal`: the "create object" dialog, shown to admins only.
  - The form has Hebrew name, English name, category and an image.
  - The submit handler requires an image, logs, and calls the create mutation. A name conflict becomes a field error, anything else a generic error.
  - `handleOpenChange` resets all state when the dialog closes.
  - On success it refreshes the lists and calls `onCreated`.
- `ModalRow`: label, control and error layout row.

### `components/object-list/object-list.tsx`
- `ObjectList`: shows the title with counts ("5 of 20"), the create button, and an error, skeleton, empty state or list.
- `moveBetweenObjects(event)`: moves focus and selection with the up and down arrow keys.
- `LoadMoreSentinel`: uses an IntersectionObserver to load the next page when it scrolls into view.

### `components/object-list/object-card.tsx`
- `ObjectCard`: link card with thumbnail, bilingual name with search highlight, category badge and model count. Highlighted when active.
- `modelCountLabel(n)`: returns "מודל אחד" or "N מודלים".

### `components/object-list/object-list-parts.tsx`, `object-thumbnail.tsx`
- `ObjectListMessage`: centered message with an optional action button.
- `ObjectListSkeleton`: 6 placeholder rows while loading.
- `ObjectThumbnail`: shows the object image, falling back to a default image if there is none or it fails to load.

## features/models

### `components/object-page.tsx`
- `ObjectPage`: loads one object and its models, works out whether the user can edit (admin or above), logs `object.opened`, and renders `ModelPanel` inside `TrainingModelsProvider`.

### `components/model-panel.tsx`
- `ModelPanel`: the right-hand model list. Splits models into matching and others by the search term, with a "show all / show only matching" toggle.
  - Shows two sections, "in training" and "in catalog", and a "create model" button for editors.
  - Inner `countLabel` formats "shown/total" while filtering.
  - The edit and exit-edit callbacks navigate to the edit or object URL.

### `components/card/model-card.tsx`
- `ModelCard`: switches between view and edit mode and opens the clone dialog.

### `components/card/model-card-view.tsx`
- `ModelCardView`: the read-only card. Shows the first 4 specs with a "show more / less" toggle, plus edit and duplicate actions if the user can edit.

### `components/card/model-card-edit.tsx`
- `toField(value)`: converts a number or null to a string for the input.
- `toPatchNumber(value)`: converts the input string to a number, or `undefined` if empty.
- `scoreError(value)`: validates that the value is a number between 0 and 1.
- `ModelCardEdit`: edit form for the three score fields (recommended threshold, precision, recall).
  - On submit it calls `updateModel`.
  - On success it refreshes, logs and exits edit mode. On failure it logs and shows "save failed".
  - The save button is disabled if the form is invalid, unchanged or saving.

### `components/card/model-card-parts.tsx`
- `ModelCardFrame`, `ModelCardHeader`, `ModelCardTitle`, `ModelCardActions`, `ModelCardDetails`, `ModelCardTabs`: layout pieces. The tabs component currently has a single "details" tab.
- `ModelHeading`: model name (bilingual if it has a Hebrew name) plus the status badge.
- `EditModelButton`: pencil / pencil-off toggle button.
- `IconActionButton`: icon button with a tooltip, used internally.
- `DestructiveIconButton`: red X button built on it.
- `ModelActionsMenu` / `ModelAction`: the "⋮" dropdown and its items.
- `SpecRow`: one label and value row. Can include a hint tooltip, a badge list, or an expandable list.
- `ExpandableSpecValue`: button that expands a hidden list of badges.
- `SpecBadgeList`: renders a list of badges.
- `SpecHint`: info icon with a tooltip.

### `components/card/model-edit-row.tsx`, `status-badge.tsx`
- `ModelEditRow`: label, input and error row for edit mode.
- `StatusBadge`: colored badge with a Hebrew label and icon for a status (operational, experimental, not started, running, error).

### `components/form/clone-model-modal.tsx`
- `cloneForm(sourceId, source)`: pre-fills the clone form from the source model (sensor group, resolutions, areas) with empty names.
- `CloneModelModal`: the duplicate dialog. On submit it calls `cloneModel`. On success it refreshes the data, logs and closes. On failure it shows a Hebrew error.

### `components/form/create-model-modal.tsx`
- `emptyForm(objectId)`: initial values for a new model.
- `CreateModelModal`: the create dialog. Name fields, sensor group, resolution range, areas, and positive and empty-field tagging classes. On success it shows a toast, refreshes training models and closes. Shows a loading or failed state for the tagging classes.

### `components/form/model-form-dialog.tsx`
- `ModelFormDialog`: the dialog shell (header, close button, form submit handling).
- `ModelFormBody`: scrollable body. `ModelFormSection`: titled section. `ModelFormFooter`: cancel button plus a primary slot.
- `ModelForm`: bundles these and all the fields into one namespace (`ModelForm.Dialog`, `ModelForm.Body`, ...).

### `components/form/model-form-parts.tsx`
- `useModelField(name)`: connects a field to the current form through React context.
- `ModalRow`: label, control and error row. `touchedError(meta)`: returns the error only after the field was touched.
- `EnglishNameHint`: wand-icon tooltip with the English-name rule.
- `HebrewNameField`, `EnglishNameField`: the two name inputs.
- `SensorGroupField`: sensor-group dropdown. `selectSensorGroup` also clears min/max resolution values the new group doesn't allow.
- `GeographyField`: multi-select for areas.
- `TaggingClassesSelect`: tagging-class multi-select tied to a form field.
- `CropSelectionToggle`: switches between "all" and "manual" crop selection.
- `CropIdsInput`: textarea of crop IDs, parsed into an array.
- `PositiveTaggingClassesField`: positive tagging classes with the crop toggle and input. `EmptyFieldsClassesField`: empty-fields class selector.
- `ResolutionInput`: free number input. `ResolutionSelect`: dropdown limited to allowed values. `ResolutionRangeField`: uses the dropdowns when the sensor group defines resolutions, number inputs otherwise.
- `SubmitButton`: submit button, disabled while invalid or submitting.

### `components/form/tagging-classes-multi-select.tsx`
- `TaggingClassesMultiSelect`: popover multi-select that shows the chosen items as badges. `toggle` adds or removes a value. Also reused for the area field.

### `components/training/cancel-training-action.tsx`
- `CancelTrainingAction`: red button that opens a confirmation dialog. On confirm it calls `abortModelTraining`. On success it toasts, hides the mission locally, closes and refreshes. On failure it shows a Hebrew error.

### `components/training/training-model-card.tsx`
- `TrainingModelCard`: card for a model being trained, with a status badge, a cancel action and its spec rows.

### `context/training-models-context.tsx`
- `TrainingModelsProvider`: polls the object's training models every 10 seconds (60 seconds when there are none), only for editors.
  - An effect detects when a mission disappears from the list and refreshes the object, since the model has probably been published. It also prunes stale cancelled IDs.
  - Hides cancelled missions and missions that already exist as real models.
  - `cancelMission`: hides a mission immediately.
- `useTrainingModels()`: reads this context, throws if missing.

### `context/model-form-context.ts`, `hooks/use-model-form.ts`
- `model-form-context.ts` creates the form and field contexts.
- `use-model-form.ts` exports `useModelForm`, the app form hook built on those contexts.

### `hooks/use-model-detail-specs.ts`
- `useModelDetailSpecs(model)`: returns the spec rows for a model, with area and sensor labels and the resolution unit taken from config.

### `lib/model-labels.ts`
Mostly Hebrew label, message and placeholder constants, plus:
- `resolutionRangeLabel(min, max, unit)`: formats "מ X עד Y unit", or "—" when both are empty.
- `formatTimestamp(ts)`: reformats `YYYY-MM-DD HH:mm` as `DD/MM/YYYY HH:mm` with a regex, no timezone conversion.
- `formatLocalTimestamp(ts)`: parses an ISO date and formats it as `dd/MM/yyyy HH:mm`. Returns the original text if the date is invalid.
- `valueOrEmpty(value)`: returns the value as a string, or "—" for null or empty.
- `dexterThresholdValue(threshold)`: turns the dexter threshold object into a list of "key: value" items, or "—" if empty.
- `modelDetailSpecs(model, labels, unit)`: builds the model's spec rows: English name, area, sensor group (with its sensors), resolution, score thresholds, precision, recall, depth threshold, dexter threshold (only if the model has it), last editor and update time.
- `trainingModelSpecs(trainingModel)`: builds the rows for a training model: English name, creation date, creator.

### `lib/split-by-model-name.ts`
- `splitByModelName(term, models)`: splits models into those whose English or Hebrew name contains the search term (case-insensitive) and the rest. An empty term matches everything.

## features/permissions

### `components/permissions-panel.tsx`
- `PermissionsPanel`: admin screen for granting and removing roles.
  - `canManageRole(role)`: superadmins can manage any role, others only roles up to viewer. `grantableRoles` filters the role dropdown with it.
  - `invalidateList`: refreshes the permission list.
  - `handleSubjectTypeChange` / `handleRoleChange`: validate dropdown values with zod before saving them in state.
  - `handleSubmit`: requires a non-empty ID, then calls `permissions.set`.
  - The table lists permissions with a remove button, disabled when pending or when the role isn't manageable.
]]