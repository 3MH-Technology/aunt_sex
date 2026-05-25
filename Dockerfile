FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/web
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app/apps/web
RUN apk add --no-cache curl \
  && addgroup -S nodejs \
  && adduser -S nextjs -G nodejs
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/prisma ./prisma
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
USER nextjs
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
