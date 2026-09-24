# CI Pipeline

## Definition

The CI pipeline is the automated sequence that runs on every change: verify the
code, build container images, deploy them. Jarvis runs two pipelines over the same
repository — a GitHub Actions workflow and a GitLab CI pipeline — which overlap on
verification and diverge on everything after it.

## Mental Model

Think of it as a funnel with a widening blast radius at each stage:

```
verify   →  cheap, runs on everything, blocks the merge
   ↓        (lint, typecheck, build, test)
build    →  expensive, runs only on the default branch or a tag
   ↓        (container images pushed to the registry)
deploy   →  irreversible, runs only when a human clicks it
            (helm upgrade against the cluster)
```

Each stage is a gate the change has to survive. The further down, the fewer things
reach it and the more it costs to get wrong — so the gates get stricter, ending in
a manual one.

The two CI systems are not a fallback for each other. GitHub Actions only verifies;
GitLab verifies **and** ships. The sources do not say why both exist.

## The two systems

### GitHub Actions — verification only

One job, on push to `main` and on every pull request:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

Superseded PR runs are cancelled; runs on `main` are left alone to finish. The
steps are `nx sync:check`, `pnpm format:check`, then:

```bash
pnpm exec nx affected -t lint typecheck build test
```

`actions/checkout` uses `fetch-depth: 0` and `nrwl/nx-set-shas` computes the base
commit — `affected` needs real git history to diff against, which a shallow clone
does not have.

### GitLab CI — verify, build, deploy

Three stages. `verify` runs the same checks, but chooses its scope:

```bash
if [ -n "$CI_MERGE_REQUEST_DIFF_BASE_SHA" ]; then
  pnpm exec nx affected -t lint typecheck build test --base="$CI_MERGE_REQUEST_DIFF_BASE_SHA"
else
  pnpm exec nx run-many -t lint typecheck build test
fi
```

Merge request pipelines have a diff base, so they run [[nx-task-execution]]'s
`affected`. Branch and tag pipelines have no meaningful base, so they run
everything. See [[q-nx-affected-vs-run-many]] for why the diff stops being the
right signal there.

pnpm's store is cached on the lockfile, so the cache is reused until a dependency
actually changes:

```yaml
cache:
  key:
    files:
      - pnpm-lock.yaml
  paths:
    - .pnpm-store
```

## Where the two diverge

| | GitHub Actions | GitLab CI |
|---|---|---|
| Base commit for `affected` | `nrwl/nx-set-shas` | `$CI_MERGE_REQUEST_DIFF_BASE_SHA` |
| Scope on the default branch | `affected` | `run-many` (everything) |
| Builds images | no | yes, via [[kaniko-builds]] |
| Deploys | no | yes, behind a manual gate |

The scope difference is worth noting: a push to `main` runs a narrower set of tasks
on GitHub than the equivalent GitLab branch pipeline does. Whether that is deliberate
is not stated in the sources.

## The deploy stage

Deploy is the only stage a human has to trigger:

```yaml
rules:
  - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'
    changes: *bff-changes
    when: manual
    allow_failure: false
```

`when: manual` holds the job until someone clicks it. `allow_failure: false` makes
the pipeline's success depend on it, so a skipped or failed deploy does not leave a
green pipeline behind. The job is also `interruptible: false` — a newer pipeline
will not cancel a deploy already in flight.

The job authenticates to OpenShift, then hands off to Helm:

```bash
oc login --server="https://api.$CLUSTER_DOMAIN:6443" ...
oc project jarvis
helm upgrade --install "$RELEASE" charts/app \
  --set image.tag="$CI_COMMIT_SHA" \
  --set secret.enabled="$SECRET" \
  --set autoscaling.enabled=true \
  --atomic --cleanup-on-fail --timeout 10m
```

One chart (`charts/app`) serves every release; the differences arrive as `--set`
flags. See [[kubernetes-deployment]] for what those flags do to the cluster.

`SECRET` defaults to `'false'` in the template and only `deploy-model-catalog-bff`
overrides it to `'true'`. The BFF is the tier holding database and service
credentials, so this reads as "only the backend release mounts a Secret" — though
the sources set the flag without explaining it.

## Working inside a closed network

Three of the five files disable TLS verification and point at internal mirrors:

```bash
npm config set registry "$NPM_REGISTRY"
npm config set strict-ssl false
```

```
--build-arg "NODE_TLS_REJECT_UNAUTHORIZED=0"
--build-arg "NPM_STRICT_SSL=false"
--skip-tls-verify --skip-tls-verify-pull --insecure-pull
```

Packages come from `$NPM_REGISTRY`, images from `$DOCKER_TEAM_REGISTRY`, and
credentials from Artifactory. This is the shape of an air-gapped or
proxy-intercepted environment, where the trusted CA is not one the default trust
store knows about. Disabling verification is the shortcut; installing the internal
CA would be the stricter fix. The sources show the shortcut and do not discuss the
tradeoff — treat the reasoning here as general knowledge rather than a documented
decision.

## Related Concepts

- [[kaniko-builds]] — How the build stage produces images without Docker
- [[pipeline-change-rules]] — Which path changes trigger which job
- [[nx-task-execution]] — `affected` and `run-many`, the verify stage's two modes
- [[kubernetes-deployment]] — What the deploy stage's Helm call does
- [[ci-monitoring]] — Watching a pipeline run and reacting to failures
- [[nx-monorepo]] — Why one repository needs selective builds at all
- [[jarvis]] — The project this pipeline ships

## Sources

- [[raw/jarvis/github/workflows/ci.yml]]
- [[raw/jarvis/gitlab/ci/verify.yml]]
- [[raw/jarvis/gitlab/ci/build.yml]]
- [[raw/jarvis/gitlab/ci/deploy.yml]]
- [[raw/jarvis/gitlab/ci/contexts/model-catalog.yml]]

GitLab and GitHub Actions keyword semantics (`when: manual`, `interruptible`,
`concurrency`, rule evaluation) are general knowledge. The reason both CI systems
exist, and whether the differing scope on the default branch is intentional, are
not addressed by these files.
