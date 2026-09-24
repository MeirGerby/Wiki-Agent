# Pipeline Change Rules

## Definition

Change rules gate a CI job on which file paths a commit touched. In a monorepo they
are what stops a one-line frontend edit from rebuilding and redeploying every
service in the repository.

## Mental Model

A monorepo pipeline has two independent questions to answer, and they are answered
by different machinery:

| Question | Mechanism | Level |
|---|---|---|
| Which **tasks** should run? | `nx affected` | project graph |
| Which **jobs** should exist? | `changes:` path globs | pipeline config |

[[nx-task-execution]]'s `affected` is the smarter of the two — it walks the
dependency graph and knows that editing `libs/ui` reaches every app importing it.
But it only works inside a job that can run nx. The build stage runs
[[kaniko-builds]], whose image has no node at all, so nx cannot be the thing that
decides whether a build job runs.

That is why both exist. Path globs are cruder, but they work at the point in the
pipeline where nothing else is available.

## Declaring the sets

The two change sets are YAML anchors, defined once and referenced by four jobs:

```yaml
.model-catalog-changes:
  bff: &bff-changes
    - apps/model-catalog/bff/**/*
    - apps/model-catalog/contract/**/*
    - libs/db/**/*
    - libs/logging/**/*
    - charts/**/*
    - .gitlab-ci.yml
    - .gitlab/ci/**/*
    - pnpm-lock.yaml
```

The leading dot makes `.model-catalog-changes` a hidden key — GitLab does not treat
it as a job, so it exists only to hold the anchors. `&bff-changes` names the list;
`*bff-changes` pastes it in wherever a rule needs it. One edit to the list changes
the build job and the deploy job together, which is the point: a build that runs
and a deploy that does not is worse than neither running.

## What both sets share

Four entries appear in both:

- `libs/db/**/*`, `libs/logging/**/*` — shared libraries, so both tiers rebuild
- `charts/**/*` — a chart change alters how both releases deploy
- `.gitlab-ci.yml`, `.gitlab/ci/**/*` — changing the pipeline rebuilds everything,
  which is the safe default when the thing being changed is the decision logic itself
- `pnpm-lock.yaml` — a dependency moved under something, even if no source did

## The interesting asymmetry

The BFF set covers all of `apps/model-catalog/bff/**/*`. The **web** set does not
include the BFF wholesale — it names three specific paths inside it:

```yaml
  web: &web-changes
    - apps/model-catalog/web/**/*
    - apps/model-catalog/bff/src/router.ts
    - apps/model-catalog/bff/src/trpc.ts
    - apps/model-catalog/bff/src/**/*.router.ts
    - apps/model-catalog/contract/**/*
    - libs/ui/**/*
    ...
```

This encodes the [[trpc]] coupling. The web client's API types are *inferred from
the BFF router's type*, so the router's shape is part of the frontend's compile-time
contract in a way the rest of the backend is not:

- Edit a router file → the web app's types change → web must rebuild
- Edit a BFF service, repository or middleware → the router type is unchanged → the
  web app is unaffected

A path list is a blunt instrument, but here it has been sharpened to match a real
dependency. Whoever wrote it worked out exactly which backend files the frontend
actually depends on, and listed those.

The cost is that the list is a hand-maintained mirror of a real relationship. A new
convention for router files — anything not matching `*.router.ts` — silently stops
triggering web builds, and nothing fails loudly when it drifts.

## Rules on the jobs

```yaml
build-model-catalog-web:
  extends: .build
  variables:
    PROJECT: '@jarvis/model-catalog-web'
    PROJECT_PATH: apps/model-catalog/web
    IMAGE_NAME: model-catalog-web
  rules:
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'
      changes: *web-changes
    - if: $CI_COMMIT_TAG
```

Rules are evaluated top to bottom and the first match wins. So:

- On the default branch, the job runs **only** if a matching path changed.
- On a tag, the job runs unconditionally — no `changes:` clause. A release ships
  every image regardless of what the diff says, the same instinct that makes the
  verify stage switch to `run-many` on tags.

`.build` has rules of its own, but a child's `rules:` replaces the parent's
outright rather than merging — so the template's rules never apply to these jobs.
This is standard GitLab `extends` behaviour and is easy to misread as additive.

The deploy jobs reuse the same anchors and add the manual gate:

```yaml
deploy-model-catalog-web:
  extends: .deploy
  needs: [verify, build-model-catalog-web]
  rules:
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'
      changes: *web-changes
      when: manual
      allow_failure: false
```

`needs:` names both the verify job and the matching build job, so a deploy can
never run against an image this pipeline did not produce.

## Related Concepts

- [[ci-pipeline]] — The stages these rules gate
- [[kaniko-builds]] — The build job, and why nx cannot gate it
- [[nx-task-execution]] — `affected`, the graph-level equivalent
- [[trpc]] — The type coupling the web change set encodes
- [[nx-monorepo]] — Why selective building is necessary
- [[module-boundaries]] — Declared dependencies between projects

## Sources

- [[raw/jarvis/gitlab/ci/contexts/model-catalog.yml]]
- [[raw/jarvis/gitlab/ci/build.yml]]
- [[raw/jarvis/gitlab/ci/deploy.yml]]

YAML anchor syntax and GitLab rule evaluation are general knowledge. The reading of
the web change set as tRPC type coupling is an inference from which paths were
chosen — the file lists them without explanation. The drift risk noted above is
analysis, not something the sources raise.
