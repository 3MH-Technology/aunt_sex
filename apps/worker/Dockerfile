FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/worker
RUN npx prisma generate --schema=../web/prisma/schema.prisma
RUN npm run build

FROM base AS runner
WORKDIR /app/apps/worker

RUN apk add --no-cache ffmpeg=7.0.2-r0 && \
    addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=deps /app/node_modules /app/node_modules

USER appuser
ENV NODE_ENV=production
CMD ["node", "dist/ffmpeg-worker.js"]
