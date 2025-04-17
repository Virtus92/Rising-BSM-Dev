#!/bin/sh
set -e

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Generating Prisma Client...${NC}"
npx prisma generate

# Robuste Migrationsstrategie - einfach und zuverlässig
echo -e "${YELLOW}Initiating database migrations...${NC}"

# WICHTIG: Warten auf die Datenbank
echo -e "${YELLOW}Waiting for database connection...${NC}"
sleep 3

# Simpler Direkt-Ansatz: Versuche npx prisma db pull - wenn es einen Fehler gibt, brauchen wir eine Migration
echo -e "${YELLOW}Checking database schema...${NC}"
if ! npx prisma db pull --print > /dev/null 2>&1; then
  echo -e "${RED}Schema and database are not aligned. Creating migration...${NC}"
  # Erstelle eine Migration mit einem Namen basierend auf dem Zeitstempel
  MIGRATION_NAME="schema_sync_$(date +%Y%m%d%H%M%S)"
  NODE_ENV=development npx prisma migrate dev --name "$MIGRATION_NAME" --create-only
else
  echo -e "${GREEN}Schema and database are aligned. No migration needed.${NC}"
fi

# Wende alle verfügbaren Migrationen an
echo -e "${YELLOW}Applying migrations...${NC}"
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
