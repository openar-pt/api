FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY src/db/migrations ./src/db/migrations
COPY src/api/docs.html ./dist/api/docs.html

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
