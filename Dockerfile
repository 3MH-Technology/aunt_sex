FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# نسخ ملفات المشروع الأساسية
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/

# تثبيت dependencies (monorepo safe)
RUN npm install

# بناء التطبيق
FROM base AS builder
WORKDIR /app

COPY . .

WORKDIR /app/apps/web

RUN npx prisma generate
RUN npm run build

# Runtime stage (خفيف)
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=3000

# نسخ output فقط (standalone Next.js)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
