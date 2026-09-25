# Build from the repo root:  docker build -f web/Dockerfile .
FROM node:22-alpine AS deps
WORKDIR /repo/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /repo/web
COPY --from=deps /repo/web/node_modules ./node_modules
COPY site /repo/site
COPY web ./
# Public (browser-side) config is baked in at build time.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 PHOTO_DIR=/data/photos
RUN addgroup -S wtfit && adduser -S wtfit -G wtfit && mkdir -p /data/photos && chown -R wtfit:wtfit /data
COPY --from=build --chown=wtfit:wtfit /repo/web/.next/standalone ./
COPY --from=build --chown=wtfit:wtfit /repo/web/.next/static ./.next/static
COPY --from=build --chown=wtfit:wtfit /repo/web/public ./public
COPY --from=build --chown=wtfit:wtfit /repo/web/migrations ./migrations
COPY --from=build --chown=wtfit:wtfit /repo/web/scripts/migrate.mjs ./scripts/migrate.mjs
# The migration script runs outside Next's bundle, so it needs the (dependency-free) driver on disk.
COPY --from=deps --chown=wtfit:wtfit /repo/web/node_modules/postgres ./node_modules/postgres
USER wtfit
EXPOSE 3000
VOLUME /data
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
