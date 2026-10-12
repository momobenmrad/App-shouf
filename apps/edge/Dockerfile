# Node build of the VOD edge (local dev / self-hosting). Production runs it as a Cloudflare Worker.
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/edge/package.json apps/edge/
RUN pnpm install --frozen-lockfile --filter @chouf/edge...
COPY packages/shared packages/shared
COPY apps/edge apps/edge
RUN pnpm --filter @chouf/edge build:node \
 && pnpm --filter @chouf/edge deploy --legacy --prod /out \
 && cp -r apps/edge/dist /out/dist

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=8787
WORKDIR /app
RUN useradd --system --uid 1001 chouf
COPY --from=build --chown=chouf /out ./
USER chouf
EXPOSE 8787
CMD ["node", "dist/node.js"]
