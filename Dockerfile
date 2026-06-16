# ════════════════════════════════════════════════
#  STAGE 1: Build
# ════════════════════════════════════════════════
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

COPY . .

RUN npx nuxt prepare
RUN npm run build

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