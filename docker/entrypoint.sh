#!/bin/sh
set -e

echo "Applying database migrations..."
until npx prisma migrate deploy; do
  echo "Database not ready, retrying in 2s..."
  sleep 2
done

echo "Starting application..."
exec "$@"
