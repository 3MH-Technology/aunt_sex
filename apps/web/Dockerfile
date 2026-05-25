FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat

# Dependencies layer
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

# Builder layer
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/web
RUN npx prisma generate
RUN npm run build

# Production runner
FROM base AS runner
WORKDIR /app/apps/web

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Node modules (full deps from monorepo root)
COPY --from=deps /app/node_modules /app/node_modules

# Prisma generated client (overlay on root node_modules)
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

# Prisma schema for migrations
COPY --from=builder /app/apps/web/prisma ./prisma
COPY apps/web/package.json ./

# Entrypoint
COPY apps/web/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# App files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

USER nextjs
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
