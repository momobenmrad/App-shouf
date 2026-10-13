# Build from the repository root: docker build -f apps/worker/Dockerfile .
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/worker/package.json apps/worker/
RUN pnpm install --frozen-lockfile --filter @chouf/worker...
COPY packages/shared packages/shared
COPY apps/worker apps/worker
RUN pnpm --filter @chouf/worker build \
 && pnpm --filter @chouf/worker deploy --legacy --prod /out \
 && cp -r apps/worker/dist /out/dist

FROM node:22-bookworm-slim AS runtime
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --uid 1001 chouf \
 && mkdir -p /work && chown chouf /work
ENV NODE_ENV=production WORK_DIR=/work
WORKDIR /app
COPY --from=build --chown=chouf /out ./
USER chouf
CMD ["node", "dist/index.js"]
