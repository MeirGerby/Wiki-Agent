# tools/: files and functions reference

`tools/` holds the workspace tooling, in four parts:

| Folder | What it is |
| --- | --- |
| `ci/` | GitLab CI helpers: an Nx target runner and a script that opens an issue with an AI analysis for every failed job |
| `docker/` | A script that starts the local Docker stack and seeds the database |
| `nx-plugin/` | `@jarvis/nx-plugin`: a generator that scaffolds a new "context" (contract, BFF and web) |
| `oxlint/` | Two Oxlint plugins: `custom` (project rules) and `anti-slop` (generic code-quality rules) |

Spec files (`*.spec.ts`) are listed only as test files. Generated files such as `routeTree.gen.ts` templates and the `favicon.ico` are not described.

## ci/

### `ci/nx-targets.sh`
A shell script. If `NX_BASE` is set, it runs `nx affected -t <targets>`. Otherwise it runs `nx run-many -t <targets>`. This lets the same CI command run only the affected projects on merge requests and everything on the default branch.

### `ci/report-failed-jobs.mjs`
Runs at the end of a failed GitLab pipeline. For each failed job it asks a model to analyse the failure and creates a GitLab issue with the result. It exits with an error if `GITLAB_ISSUE_TOKEN` is missing.

Constants: the issue label `ci-failure`, up to 3 model requests, a 60-second cap on retry waits, log and diff size limits, and `SYSTEM_PROMPT`, which tells the model to answer with two sections, "What happened" and "How to fix".

Functions:
- `hasFixSteps(text)`: true if the answer contains a `## How to fix` heading.
- `gitlab(path, body)`: calls the GitLab project API (GET, or POST when there is a body) with the issue token. Throws on a non-OK response.
- `tail(text, max)` / `head(text, max)`: keep the last or first `max` characters, with a note saying how much was cut.
- `cleanLog(trace)`: removes GitLab section markers, ANSI color codes and carriage returns from a job log.
- `commitDiff()`: fetches the commit diff (up to 100 files) as one text.
- `analyse(job, log, diff)`: asks the model once. If the answer has no fix steps, asks a second time. If that still fails, it appends a standard "no automatic fix steps" section.
- `askModel(job, log, diff, request)`: sends a streaming request to `${ANTHROPIC_BASE_URL}/v1/messages`.
  - The prompt contains the diff, the job log, job details and the commit description.
  - Retries on 429 and 5xx, honoring `retry-after`.
  - Throws on other errors, on a refusal, or on an empty answer.
- `readStream(response)`: reads the server-sent events, joins the text deltas and returns the text and the stop reason. Throws on an error event.
- `withoutAnalysis(error, log)`: the fallback issue text used when the model fails. It gives the error and the last 80 log lines.
- `report(job, analysis)`: formats the issue body (job, pipeline, ref, commit, then the analysis).
- Main flow: lists the pipeline's failed jobs (skipping jobs allowed to fail and the reporting job itself), fetches each job's log, analyses it, and creates an issue titled "CI failure: <job> on <ref> (pipeline #id)".

Other file: `ci/tsconfig.json`.

## docker/

- `docker/compose.sh`: described above.

## nx-plugin/

`@jarvis/nx-plugin` registers one generator, `context` (see `generators.json`). The generator creates three projects for a new context named `<name>`: `apps/<name>/contract`, `apps/<name>/bff` and `apps/<name>/web`. They are shaped like `apps/model-catalog`.

### `src/generators/context/generator.ts`
- `contextGenerator(tree, options)`: the generator entry point (also the default export).
  - Computes the names, then writes the contract, the BFF and the web projects with free ports.
  - Throws if all three projects already exist.
  - Unless `skipCi` is set, adds the CI file for the context. Unless `skipFormat` is set, formats the files.
  - Returns a callback that installs packages unless `skipPackageJson` is set.
- `writeContract(tree, context)`: renders the contract project and adds it to the root tsconfig references. Returns false if it already exists.
- `writeBff(tree, context, port)`: renders the BFF project, registers `<name>-bff` with the logging library, and copies `.env.example` to `.env`.
- `writeWeb(tree, context, { title, port, bffPort })`: renders the web project, registers `<name>-web` with the logging library, and copies the favicon into `public/`.
- `render(tree, kind, target, variables)`: copies the template files from `files/<kind>` into the target folder with variable substitution.

### `src/generators/context/schema.json`, `schema.d.ts`
The generator options: `name` (required), `directory`, `title`, `bffPort`, `webPort`, `skipFormat`, `skipPackageJson`, `skipCi`.

### `src/generators/context/files/` (templates)
Template files with the `__tmpl__` suffix, rendered by `generateFiles`.
- `contract/`: `package.json`, `src/index.ts`, `tsconfig.json`, `tsconfig.lib.json`.
- `bff/`: `Dockerfile`, `package.json`, `project.json`, `tsconfig` files, `vite.config.mts`, `vitest.config.mts`, `.env.example`, and `src/` with `container.ts`, `main.ts`, `router.ts`, `server-env.ts`, `server.ts`, `trpc.ts`, `web-env.ts` and `web-config/web-config.router.ts`. They mirror the model-catalog BFF.
- `web/`: `Dockerfile`, `index.html`, `package.json`, `project.json`, `tsconfig` files, `vite.config.mts`, and `src/` with `main.tsx`, `server.ts`, `styles.css`, `router-context.ts`, `routeTree.gen.ts`, `routes/__root.tsx`, `routes/index.tsx`, `context/` (auth, config, logger) and `lib/` (`adfs.ts`, `log.ts`, `trpc.ts`). They mirror the model-catalog web app.

### `src/utils/options.ts`
- `contextNames(rawName, directory?)`: builds all names and paths for a context. It returns the kebab-case name, class name, constant name, `@jarvis` scope, project names (`<name>-web`, `-bff`, `-contract`) and their roots. The root is `apps/<name>` unless a directory is given.
- `normalizeDirectory(directory)` (internal): removes a leading `./` and trailing slashes.
- `templateVariables(context, projectRoot)`: the variables for the templates: the context names plus `projectRoot`, `offsetFromRoot`, the contract and BFF import paths, the relative path to the contract, and the `tmpl` and `dot` helpers used in file names.
- `relativePath(from, to)` (internal): relative path between two project roots, or `.` if they are the same.
- `projectExists(tree, projectRoot)`: true if the folder has a `package.json`.

### `src/utils/ports.ts`
- `usedPorts(tree, pattern, expression)` (internal): collects the port numbers found in the matching config files.
- `firstFree(used, start)` (internal): the first port at or above `start` that is not in use.
- `freeBffPort(tree)`: first free BFF port, starting at 3001, based on `process.env.PORT ?? <port>` in `**/bff/vite.config.mts`.
- `freeWebPort(tree)`: first free web port, starting at 5173, based on `port: <n>` in `**/web/vite.config.mts`.

### `src/utils/logging-projects.ts`
- `registerLoggingProject(tree, project)`: adds the project name to the `Project` array in `libs/logging/src/index.ts`, keeping the `export` keyword. Returns false if the file or array is missing or the name is already there.

### `src/utils/root-tsconfig.ts`
- `addRootTsconfigReference(tree, projectRoot)`: adds `./<projectRoot>` to `references` in the root `tsconfig.json`, keeps them sorted, and skips duplicates. Does nothing if there is no root tsconfig.

### `src/utils/context-ci.ts`
- `ensureContextCi(tree, context)`: writes `.gitlab/ci/contexts/<name>.yml` unless it exists, then adds it to the `include:` list in `.gitlab-ci.yml`. Returns true if it wrote the file.
- `renderContextCi(context, ciPath)` (internal): builds the YAML. It has "changes" lists for the BFF and web, and `build-<name>-bff`, `build-<name>-web`, `deploy-<name>-bff` and `deploy-<name>-web` jobs. Builds run on the default branch when the files change, or on tags. Deploys are manual.
- `includeContextCi(tree, ciPath)` (internal): inserts the `- local: ...` line after the last existing include. It does nothing if the file or the include block is missing or the line is already there.

### Tests and config
- Specs: `generator.spec.ts`, `context-ci.spec.ts`, `logging-projects.spec.ts`, `options.spec.ts`, `root-tsconfig.spec.ts`.
- Config: `package.json`, `generators.json`, `tsconfig.json`, `vitest.config.mts`.

## oxlint/custom (project-specific rules)

`custom/index.ts` registers the plugin named `custom` with four rules. Config files: `package.json`, `project.json`, `tsconfig.json`, `vitest.config.mts`. Each rule has a `.spec.ts` next to it.

### `rules/int-test-mutation-needs-read-only-skip.ts`
Rule `custom/int-test-mutation-needs-read-only-skip`. Requires that an integration test which calls `.mutate(...)` is inside a `describe` or test with `{ skip: READ_ONLY }`. This matches the repo rule that production runs must be read-only.
- `calleeName(callee)`: the function name of a call, or the object name for `it.each`-style calls.
- `isCallOf(node, names)`: true if the call is to one of the given names.
- `hasReadOnlySkip(node)`: true if an argument is an object with `skip: READ_ONLY`.
- `isMutateCall(node)`: true for `x.mutate(...)`.
- The rule keeps two counters (test depth and skip depth). It reports a mutate call inside a test when no skip group is open.

### `rules/no-cross-feature-imports.ts`
Rule `custom/no-cross-feature-imports`. Enforces the web folder layering from AGENTS.md: routes, then features, then shared code.
- `locate(srcRoot, file)`: returns which layer and feature a file belongs to, based on its folder under `src/`.
- `violation(from, to)`: decides if an import is forbidden. A feature can't import another feature or `routes/`, and shared folders (`assets`, `components`, `context`, `hooks`, `lib`) can't import `features/` or `routes/`.
- The rule checks relative imports and re-exports only.

### `rules/zod-schema-pascal-case.ts`
Rule `custom/zod-schema-pascal-case`. Variables that hold a Zod schema must be PascalCase.
- `resolveVariable(sourceCode, identifier)`: finds the variable that an identifier refers to.
- `isZodImport(sourceCode, identifier)`: true if the identifier comes from an import of `zod` or `zod/...`.
- `calledName(callee)`: the last called name in a call.
- `isZodSchemaExpression(sourceCode, init)`: true if an initializer is a chain starting from a `zod` import and is not a non-schema call like `parse`, `safeParse` or `toJSONSchema`.

### `rules/no-unused-exports.ts`
Rule `custom/no-unused-exports`. Reports exports that no other file in `apps/`, `libs/` or `tools/` imports. An `entries` option lists glob patterns of files to skip, such as package entry points.
- `findWorkspaceRoot(filename)`: walks up to the folder with `nx.json`.
- `listSourceFiles(directory)`: all `.ts/.tsx/.mts/.cts` files, skipping `node_modules`, `dist`, `coverage`, `.nx` and `.git`.
- `resolveImport(importer, specifier)`: resolves an import with the TypeScript module resolver (including the `@jarvis/source` condition). Ignores `node_modules`.
- `collectUsages(sourceFile)`: lists every imported name from imports, re-exports, dynamic `import()` and `import()` types. A namespace import, a bare `export *` and a dynamic import count as using everything.
- `readTargets(file)`: parses a file and resolves its usages to target files.
- `buildIndex(files)`: builds a map from file to the set of names used by others.
- `refresh(root, previous)`: rescans the workspace, re-reading only files whose modified time changed.
- `usageIndex(root)`: returns the cached index, refreshed at most once per second.
- `bindingNames(pattern)` and `declaredNames(declaration)`: list the names introduced by a declaration, including destructuring.
- The rule reports every export (default, named, or re-exported) that isn't in the used set, once per name.

## oxlint/anti-slop (generic rules)

Vendored from `dmmulroy/anti-slop` (commit `c44ef22`); see `UPSTREAM.md`. The only local change is a `package.json` with `"type": "module"`. `index.ts` registers the plugin named `anti-slop` with 18 rules. Each rule follows the same pattern: a `createOnce(context)` function that returns node visitors and calls `context.report`.

### Rules

| Rule | What it reports |
| --- | --- |
| `no-array-filter-map` | Adjacent `.filter(...).map(...)` (or map then filter). Suggests iterator helpers or one `flatMap`. |
| `no-reduce-accumulator-copy` | Copying the accumulator on each `reduce` step (`Object.assign`, `Array.from`, array copy methods), which causes quadratic work. |
| `no-chained-type-assertions` | `x as A as B` chains (`as` and angle-bracket), including parenthesized chains. Const assertions are allowed. |
| `no-conditional-empty-object-spread` | `...(cond ? { a } : {})`. Build the object in steps instead. |
| `no-known-value-widening` | Giving a value with a known type an explicitly broad or anonymous type. Suggests inference, `satisfies`, or a named type. |
| `no-widen-then-assert` | A local `const` that is widened by an annotation and later cast back with `as`. |
| `no-module-mocking` | Vitest/Jest module mocking (`vi.mock`, `jest.mock`, and similar). Use dependency injection. |
| `no-object-parameters` | Parameters typed as the broad `object` type. |
| `no-unknown-parameters` | Parameters typed `unknown`, except `cause` and type-predicate subjects. |
| `no-unknown-returns` | Functions returning `unknown` or `Promise<unknown>`. |
| `no-unknown-type-aliases` | Type aliases that resolve to `unknown`. |
| `no-unsafe-dictionary-type` | Dictionary types (`Record<string, X>`, index signatures, mapped types) whose value is `unknown`, `any`, `object`, `{}`, or a union or alias containing those. |
| `no-reflect-apply`, `no-reflect-get` | Calls to `Reflect.apply` and `Reflect.get`. |
| `no-runtime-typeof` | Runtime `typeof` checks. An `allowInTypeGuards` option allows them inside type-guard functions. Existence probes (`typeof x === 'undefined'`-style) are treated separately. |
| `no-shape-in-symbol-names` | Names containing "shape" in any case, except borrowed member names. |
| `require-safety-comment-for-type-assertion` | Type assertions without a nearby `SAFETY:` comment. A `markers` option changes the accepted marker words. |
| `require-readable-spacing` | Missing blank lines around imports, functions, classes, types, multi-line declarations, `return`/`if`/`switch`/`try`/loops and block-like statements. Fixes by adding blank lines. |

Helper functions inside the rule files:
- `no-chained-type-assertions.ts`: `isTypeAssertionExpression`, `unwrapParenthesizedExpression`, `isConstAssertion`, `isOutermostAssertionInChain` (so the chain is reported once), `isForbiddenAssertionChain`.
- `no-conditional-empty-object-spread.ts`: `unwrapParentheses`, `isEmptyObjectExpression`, `isConditionalEmptyObjectSpread` (a ternary or logical expression with an empty-object branch).
- `no-known-value-widening.ts`: `unwrapExpression`, `variableDeclarator`, `isStableConstVariable`, `hasKnownEvidence`, `isFunctionExpression`, `localFunctionForCall`, `variableTypeAnnotation`, `hasInformativeType`, `hasKnownCallArgumentEvidence`, `typePredicateSubjectIndex`, `annotationTarget`, `enclosingFunction`, `sourceKeyName`, `functionName`, `isEmptyObjectExpression`, `isDictionaryAccumulatorTarget`, `hasParentAssertion`. Together they decide whether a value's type is known from its syntax, and whether the target type discards that knowledge.
- `no-widen-then-assert.ts`: `unwrapExpressionParentheses`, `unwrapTypeParentheses`, `typeReferenceName`, `isUnknownOrAnyType`, `isBroadRecordKeyType`, `isBroadRecordType`, `broadTypeKind`, `assertedExpression`, `assertionFromExpression`, `normalizedTypeText`, `typesHaveSameSyntax`, `isDefinitelyObjectType`, `isDefinitelyNarrowerRecordType`, `functionBoundary`, `resolvedVariableForIdentifier`, `variableDeclarator`, `knownValueEvidence`, `widenedBinding`, `assertionIsNarrower`. They follow a variable from its widened declaration to a later assertion.
- `no-module-mocking.ts`: `importedName`, `isTestFrameworkObject` (is it `vi` or `jest`, imported or global), `moduleMockCall`.
- `no-reduce-accumulator-copy.ts`: `enclosingReducer` (finds the surrounding `reduce` callback and accumulator), `referencesAccumulator`, `isGlobalCopyOwner` (is `Object` or `Array` the global).
- `no-runtime-typeof.ts`: `isRuntimeFunction`, `isInsideTypeGuard`, `isExistenceProbe`.
- `no-shape-in-symbol-names.ts`: `containsForbiddenSymbolName`, `isBorrowedMemberName`.
- `no-unknown-parameters.ts`: `isTypePredicateSubject`.
- `no-unsafe-dictionary-type.ts`: `isTypeNode`, `typeReferenceName`, `isInsideTypeAliasDeclaration`, `isPlainAliasConsumerUse`, `isInsideTypeParameterConstraint`, `shouldReportType`.
- `require-safety-comment-for-type-assertion.ts`: `isConstAssertion`, `configuredSafetyMarkers`, `markerPattern`, `hasSafetyJustificationBefore`, `hasSafetyComment`.
- `no-array-filter-map.ts`, `no-object-parameters.ts`, `no-reflect-*.ts`, `no-unknown-returns.ts`, `no-unknown-type-aliases.ts`: no helper functions beyond the rule body.

### `shared/` (helpers used by several rules)
- `array-method.ts`: `unwrapArrayExpression` (strips parentheses and wrappers), `resolveArrayBinding` (finds the variable behind an array expression), `arrayMethodTarget` (if a call is `<array>.method(...)`, returns the method name and array), `isArrayAnnotation`, `isKnownArrayExpression` (is the expression known to be an array).
- `scope.ts`: `resolveVariable(sourceCode, identifier)`: looks up an identifier's variable through the scope chain.
- `reflect-method.ts`: `isGlobalReflect` (internal), `isGlobalReflectMethodCall(sourceCode, callee, methodName)`: is the call `Reflect.<method>` on the global `Reflect`.
- `function-parameters.ts`: `containsUnknownType`, `functionParameterTypeAnnotation`, `functionParameterBindingName`.
- `lexical-type-parameters.ts`: `isNode`, `collectInferTypeParameterNames`, `lexicalTypeParameterNames`: finds type parameters visible at a node, including `infer` ones.
- `type-alias-resolution.ts`: builds a scope-aware map of type aliases and resolves a type through aliases and substituted generic arguments. Key exports: `createTypeAliasEnvironment`, `visibleTypeAlias`, `hasVisibleTypeBinding`, `resolvedTypeMatches`. Internals: `enclosingTypeScope`, `declaredTypeBinding`, `collectTypeBindings`, `ancestorDistance`, `nearestTypeBindings`, `aliasSubstitutions`.
- `dictionary-types.ts`: the type-classification logic behind `no-unsafe-dictionary-type` and `no-known-value-widening`. Key exports: `createTypeEnvironment`, `classifyUnsafeDictionary`, `classifyUnsafeDictionaryValue`, `classifyWideningTarget`, `isPopulatedObjectExpression`, `isKnownEvidenceExpression`. Internals handle alias substitution, effectively empty interfaces and type literals, mapped-type keys, and unwrapping transparent types.

### `vendor/eslint-stylistic/` (copied from ESLint Stylistic, MIT)
- `padding-line-between-statements.ts`: the `padding-line-between-statements` rule from ESLint Stylistic (commit `435c3ea`), adapted for Oxlint.
  - Default export `createPaddingLineRule(options)` builds the rule from a list of padding configs.
  - Internal helpers match statement kinds and selectors: `newKeywordTester`, `newNodeTypeTester`, `isIIFEStatement`, `isCJSRequire`, `isBlockLikeStatement`, `isDirective`, `isDirectivePrologue`, `isCJSExport`, `isExpression`.
  - The rest do the reporting and fixes: `getActualLastToken`, `replacerToRemovePaddingLines`, `getReportLoc`, `verifyForAny`, `verifyForNever`, `verifyForAlways`.
  - `PaddingTypes` defines the statement categories.
- `padding-line-ast.ts`: small AST and token helpers: `isClosingBraceToken`, `isSemicolonToken`, `isNotSemicolonToken`, `isTokenOnSameLine`, `isFunction`, `isSingleLine`, `skipChainExpression`, `isTopLevelExpressionStatement`, `isParenthesized`, and the `LINEBREAKS` set.
- `padding-line-options.d.ts`: option types. `LICENSE` and `UPSTREAM.md` record provenance and the local changes.
