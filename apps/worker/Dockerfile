FROM node:20-alpine@sha256:73e6b4e6fd00f3aadbecb20f0031cb5a5ec5a45e18c57266cb3f280c9707eb27 AS base

RUN apk add --no-cache ffmpeg=7.0.2-r0 && \
    addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

USER appuser
CMD ["node", "dist/ffmpeg-worker.js"]
