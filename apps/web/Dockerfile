# Build from the repository root: docker build -f apps/web/Dockerfile .
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @chouf/web...
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @chouf/web build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN useradd --system --uid 1001 chouf
COPY --from=build --chown=chouf /repo/apps/web/.next/standalone ./
COPY --from=build --chown=chouf /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=chouf /repo/apps/web/public ./apps/web/public
USER chouf
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
