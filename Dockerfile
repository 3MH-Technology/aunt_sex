FROM node:20-alpine AS base

# Install openssl for Prisma engine
RUN apk add --no-cache openssl

# Dependencies layer
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/
RUN cd apps/web && npm ci

# Builder layer
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN apk add --no-cache openssl && \
    cd apps/web && npx prisma generate && npm run build

# Production runner
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Prisma files
COPY --from=builder /app/apps/web/prisma ./prisma
COPY --from=builder /app/apps/web/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/web/node_modules/@prisma ./node_modules/@prisma
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
