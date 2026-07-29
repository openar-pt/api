FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY src ./src
RUN pnpm run build

FROM node:22-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Infisical CLI — pinned; see https://infisical.com/docs/cli/overview
RUN apk add --no-cache bash wget \
 && wget -qO- https://artifacts-cli.infisical.com/setup.apk.sh | sh \
 && apk add --no-cache infisical=0.43.114

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY src/db/migrations ./src/db/migrations
COPY src/api/docs.html ./dist/api/docs.html
COPY scripts/with-secrets.sh scripts/etl-worker.sh scripts/next-run-delay.mjs ./scripts/
RUN chmod +x ./scripts/with-secrets.sh ./scripts/etl-worker.sh \
 && chown -R appuser:appgroup /app

USER appuser
ENV NODE_ENV=production
ENV INFISICAL_DISABLE_UPDATE_CHECK=true
EXPOSE 3000

CMD ["./scripts/with-secrets.sh", "node", "dist/index.js"]
