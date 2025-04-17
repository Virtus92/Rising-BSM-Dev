#!/bin/sh
set -e

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Generating Prisma Client...${NC}"
npx prisma generate

echo -e "${YELLOW}Running database migrations...${NC}"
npx prisma migrate deploy

# Seed database if required
if [ "$NODE_ENV" = "development" ] || [ "$SEED_DATABASE" = "true" ]; then
  echo -e "${YELLOW}Seeding database...${NC}"
  # Use our custom seed script
  node scripts/seed.js
fi

# Start the application
echo -e "${YELLOW}Starting application in ${NODE_ENV} mode...${NC}"
exec "$@"
