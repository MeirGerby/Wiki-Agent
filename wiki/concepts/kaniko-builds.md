# Kaniko Builds

## Definition

Kaniko builds container images from a Dockerfile inside a container, without a
Docker daemon. It executes each Dockerfile instruction in userspace and snapshots
the filesystem between them, which lets an unprivileged CI job produce and push an
image.

## Mental Model

`docker build` is a client. It ships your context to a daemon that does the real
work, and that daemon runs as root on the host. In a Kubernetes-based CI runner
there is no daemon to talk to, and mounting the host's socket would hand every
pipeline root on the node.

Kaniko removes the client/daemon split: it *is* the builder, running as the job
itself.

```
docker build:   job → /var/run/docker.sock → daemon (root on host) → image
kaniko:         job → /kaniko/executor → image
```

The consequence is the part that shapes everything else. The Kaniko image contains
the executor binary and busybox — nothing else:

> The Kaniko image holds one binary and busybox — no node, no pnpm — so the build
> runs inside the Dockerfile, not through nx.

So the CI job cannot run `nx build` or `pnpm install` before building. There is no
node to run them with. Everything the image needs must happen in Dockerfile steps,
and the job's only job is to invoke the executor with the right arguments.

## The template

One `.build` template; each extending job supplies `PROJECT`, `PROJECT_PATH` and
`IMAGE_NAME`:

```yaml
.build:
  stage: build
  image:
    name: $KANIKO_IMAGE
    entrypoint: ['']
  needs: [verify]
  variables:
    IMAGE: $DOCKER_TEAM_REGISTRY/jarvis-$IMAGE_NAME
```

`entrypoint: ['']` clears the image's entrypoint. GitLab runs job scripts as shell
commands, and an image whose entrypoint is the executor itself would swallow them.

`needs: [verify]` means no image is built until the checks pass.

## Registry authentication

Kaniko reads the same config file the Docker CLI does, so the job writes one by
hand:

```bash
mkdir -p /kaniko/.docker
AUTH=$(printf '%s:%s' "$ARTIFACTORY_USERNAME" "$ARTIFACTORY_API_KEY" | base64 | tr -d '\n')
cat > /kaniko/.docker/config.json <<EOF
{"auths":{"${DOCKER_TEAM_REGISTRY%%/*}":{"auth":"$AUTH"}}}
EOF
```

`${DOCKER_TEAM_REGISTRY%%/*}` strips everything from the first `/` onward, leaving
the registry host — the key the auth entry has to be filed under. `tr -d '\n'`
removes the newline `base64` appends, which would otherwise corrupt the credential.

Note that the credential is base64, not encryption. It is obfuscated, not protected.

## Invoking the executor

```bash
PNPM_VERSION=$(sed -n 's/.*"packageManager": *"pnpm@\([^"]*\)".*/\1/p' package.json)
/kaniko/executor \
  --context "$CI_PROJECT_DIR" \
  --dockerfile "$CI_PROJECT_DIR/$PROJECT_PATH/Dockerfile" \
  --build-arg "PROJECT=$PROJECT" \
  --build-arg "PROJECT_PATH=$PROJECT_PATH" \
  --build-arg "PNPM_VERSION=$PNPM_VERSION" \
  --destination "$IMAGE:$CI_COMMIT_SHA" \
  --destination "$IMAGE:$CI_PIPELINE_IID" \
  --cache=true --cache-run-layers --use-new-run \
  --snapshot-mode=redo \
  --cache-repo "$DOCKER_TEAM_REGISTRY/jarvis-cache"
```

Three things worth pulling out:

**The context is the repository root, not the project directory.** A monorepo
Dockerfile needs the lockfile, the workspace manifest and any libraries the project
imports — all of which live above `apps/model-catalog/bff/`. The `--dockerfile`
path points into the project; the context stays at the top.

**`PNPM_VERSION` is scraped from `package.json`.** The `packageManager` field is
the single source of truth, so the image cannot drift onto a different pnpm than
the workspace uses. The GitLab verify job does the same thing by a different
route — `node -p "require('./package.json').packageManager.split('@')[1]"` — because
it has node available and the Kaniko job does not.

**Every image gets two tags.** `$CI_COMMIT_SHA` is the immutable one, and it is
what the deploy job passes to Helm as `image.tag`. `$CI_PIPELINE_IID` is the
short per-project pipeline counter, useful for humans reading the registry. Same
image, two names.

## Caching

```
--cache=true                                    # reuse cached layers
--cache-repo $DOCKER_TEAM_REGISTRY/jarvis-cache  # where they live
--cache-run-layers                              # cache RUN steps too
--use-new-run                                   # newer RUN implementation
--snapshot-mode=redo                            # cheaper change detection
```

Kaniko has no local layer store between jobs, so the cache is a registry
repository. Without `--cache-repo` every build reinstalls every dependency from
scratch.

`--snapshot-mode=redo` decides changed files from stat metadata rather than
hashing full contents — faster, at the cost of missing a change that preserves
size and mtime. The flag semantics here are general knowledge; the sources set
them without commentary.

## Related Concepts

- [[ci-pipeline]] — The stage this runs in, and what happens either side of it
- [[pipeline-change-rules]] — What decides whether a build job runs at all
- [[kubernetes-deployment]] — Where the resulting image is deployed
- [[nx-monorepo]] — Why the build context is the repository root

## Sources

- [[raw/jarvis/gitlab/ci/build.yml]]
- [[raw/jarvis/gitlab/ci/contexts/model-catalog.yml]]

Kaniko's architecture and flag semantics, and the security argument against
mounting the Docker socket, are general knowledge. The source file states the
"one binary and busybox" constraint directly; the Dockerfiles it builds are not
among these sources, so what happens inside them is not documented here.
