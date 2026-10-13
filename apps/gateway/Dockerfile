# Build from the repository root: docker build -f apps/gateway/Dockerfile .
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/gateway/package.json apps/gateway/
RUN pnpm install --frozen-lockfile --filter @chouf/gateway...
COPY packages/shared packages/shared
COPY apps/gateway apps/gateway
RUN pnpm --filter @chouf/gateway build \
 && pnpm --filter @chouf/gateway deploy --legacy --prod /out \
 && cp -r apps/gateway/dist /out/dist

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=8788
WORKDIR /app
RUN useradd --system --uid 1001 chouf
COPY --from=build --chown=chouf /out ./
USER chouf
EXPOSE 8788
CMD ["node", "dist/index.js"]
