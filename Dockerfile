FROM oven/bun:1.1.34 AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile || bun install

FROM oven/bun:1.1.34 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

FROM oven/bun:1.1.34-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-impress \
    poppler-utils \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 3000 4000

CMD ["bun", "run", "dev"]
