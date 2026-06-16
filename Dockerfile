# ════════════════════════════════════════════════
#  STAGE 1: Build
# ════════════════════════════════════════════════
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.5.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm run build

# ════════════════════════════════════════════════
#  STAGE 2: Production
# ════════════════════════════════════════════════
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/.output /app/.output

EXPOSE 3002

ENV PORT=3002
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]