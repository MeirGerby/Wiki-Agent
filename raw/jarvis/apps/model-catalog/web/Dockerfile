# syntax=docker/dockerfile:1

# Define args with default values, this can be changed by --build-arg BASE_IMG="blabla"
ARG BASE_IMG=node:24-alpine

# --- base ---------------------------------------------------------------------
# A reusable stage holding the toolchain and nothing else. It names no workspace and
# no project, so its layers are byte-identical in every app and the Kaniko cache is
# shared between images.
FROM ${BASE_IMG} AS base

# BASE_IMG is redeclared where it is used; these are the toolchain args.
ARG NPM_REGISTRY=https://registry.npmjs.org/
# Internal mirrors usually present a private CA that the base image does not trust.
ARG NPM_STRICT_SSL=false
ARG NODE_TLS_REJECT_UNAUTHORIZED=0
# Keep in step with packageManager in the root package.json.
ARG PNPM_VERSION=10.32.1

ENV NODE_TLS_REJECT_UNAUTHORIZED=${NODE_TLS_REJECT_UNAUTHORIZED} \
    NX_DAEMON=false \
    PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

# One layer: configure both clients, install pnpm, drop the npm cache.
RUN npm config set registry "${NPM_REGISTRY}" \
  && npm config set strict-ssl "${NPM_STRICT_SSL}" \
  && npm install -g pnpm@${PNPM_VERSION} \
  && pnpm config set registry "${NPM_REGISTRY}" \
  && pnpm config set strict-ssl "${NPM_STRICT_SSL}" \
  && npm cache clean --force

# --- builder ------------------------------------------------------------------
# Builds the one project it is asked for and leaves the result at a fixed path, so
# the runner never needs to know where in the workspace that project lives.
FROM base AS builder
ARG PROJECT
ARG PROJECT_PATH

WORKDIR /app

# Only the lockfile first, so the download layer survives every source edit.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN pnpm fetch

COPY . .

RUN set -eu; \
  echo "Installing workspace dependencies"; \
  pnpm install --frozen-lockfile --prefer-offline; \
  echo "Building ${PROJECT}"; \
  pnpm exec nx build "${PROJECT}"; \
  echo "Collecting the runtime files"; \
  mv "${PROJECT_PATH}/dist" /app/out; \
  echo "Removing build metadata"; \
  find /app/out -type f \( -name "*.map" -o -name "*.tsbuildinfo" \) -delete; \
  echo "Removing the build workspace before this layer is snapshotted"; \
  rm -rf \
    /app/.nx \
    /app/apps \
    /app/libs \
    /app/node_modules \
    /app/tools \
    "${PNPM_HOME}/store" \
    /tmp/*

# --- runner -------------------------------------------------------------------
# A clean base, so no build tool and no TLS relaxation reaches the shipped image.
FROM ${BASE_IMG} AS runner
ENV NODE_ENV=production \
    PORT=8080 \
    STATIC_ROOT=./public

WORKDIR /app
COPY --from=builder /app/out ./

# node reads a bare .js as CommonJS, and OpenShift runs a random UID with GID 0.
RUN printf '{"type":"module","private":true}\n' > package.json \
  && chgrp -R 0 /app \
  && chmod -R g=u /app

USER 1001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT}/health" || exit 1
CMD ["node", "main.js"]
