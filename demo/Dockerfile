# Chouf demo image: web + live gateway + demo stand-ins (auth, edge) in one container.
# Build from the repository root (docker compose -f docker-compose.demo.yml up --build does it).
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/gateway/package.json apps/gateway/
RUN pnpm install --frozen-lockfile --filter @chouf/web... --filter @chouf/gateway...
COPY packages/shared packages/shared
COPY apps/web apps/web
COPY apps/gateway apps/gateway
RUN pnpm --filter @chouf/web build \
 && pnpm --filter @chouf/gateway build \
 && pnpm --filter @chouf/gateway deploy --legacy --prod /gateway \
 && cp -r apps/gateway/dist /gateway/dist

# The demo video is generated at build time instead of being stored in the repository.
FROM node:22-bookworm-slim AS media
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*
COPY demo/media/make.sh /make.sh
RUN sh /make.sh /media/hls

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN useradd --system --uid 1001 chouf
COPY --from=build --chown=chouf /repo/apps/web/.next/standalone ./web/
COPY --from=build --chown=chouf /repo/apps/web/.next/static ./web/apps/web/.next/static
COPY --from=build --chown=chouf /repo/apps/web/public ./web/apps/web/public
COPY --from=build --chown=chouf /gateway ./gateway/
COPY --from=media /media/hls ./media/hls/
COPY demo/media/artwork ./media/artwork/
COPY demo/mock ./mock/
COPY demo/start.sh ./start.sh
USER chouf
EXPOSE 3000 8787 8788 54321
CMD ["bash", "/app/start.sh"]
