#!/bin/sh
set -e

echo "=== Starting Aunt Sex ==="
echo "PORT=$PORT"
echo "NODE_ENV=$NODE_ENV"
echo "Working directory: $(pwd)"
echo "Server.js exists: $(test -f server.js && echo yes || echo no)"

if [ ! -f server.js ]; then
  echo "ERROR: server.js not found!"
  echo "Files in /app:"
  ls -la
  exit 1
fi

echo "Executing: node server.js"
exec node server.js