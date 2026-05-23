#!/bin/sh
set -e

echo "=== Running database migrations ==="
npx prisma migrate deploy

if [ "$NODE_ENV" != "production" ]; then
  echo "=== Seeding database ==="
  npx prisma db seed || echo "Seed skipped (data already exists)"
fi

echo "=== Starting application ==="
exec "$@"
