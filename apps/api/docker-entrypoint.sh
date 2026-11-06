#!/bin/sh
set -eu
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  ./node_modules/.bin/prisma migrate deploy --schema apps/api/prisma/schema.prisma
fi
if [ "${SEED_ON_START:-false}" = "true" ]; then
  node apps/api/dist/database/seed.main.js
fi
exec "$@"
