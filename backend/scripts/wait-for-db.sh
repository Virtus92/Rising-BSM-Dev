#!/bin/sh
# wait-for-db.sh

set -e

echo "Running prisma migrations..."
npx prisma migrate dev --name init
npx prisma generate
npm run dev

echo "Checking database status..."
if npx prisma migrate status | grep -q "Database schema is not empty"; then
  echo "Creating baseline migration for existing database..."
  npx prisma migrate diff \
    --from-empty \
    --to-schema-datamodel prisma/schema.prisma \
    --script > prisma/migrations/init/migration.sql
  
  mkdir -p prisma/migrations/init
  echo "-- Init existing schema" > prisma/migrations/init/migration.sql
  npx prisma db pull --schema=prisma/schema.prisma
  npx prisma migrate resolve --applied init
else
  echo "Running prisma migrate deploy..."
  npx prisma migrate deploy
fi
  echo "Running db seed..."
  npm run db:seed

exec "$@"