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
RUN cp -r .next/static .next/standalone/.next/static

FROM base AS runner
WORKDIR /app/apps/web
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Node modules
COPY --from=deps /app/node_modules /app/node_modules

# Prisma generated client
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

# Prisma schema for migrations
COPY --from=builder /app/apps/web/prisma ./prisma
COPY apps/web/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# App files (standalone)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/public ./public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER nextjs
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
