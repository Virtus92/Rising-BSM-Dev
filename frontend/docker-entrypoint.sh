#!/bin/sh
set -e

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Run prisma generate to ensure client is up-to-date
log_info "Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
  log_error "Failed to generate Prisma client"
  exit 1
fi
log_success "Prisma client generated successfully"

# Apply database migrations if any
log_info "Running database migrations..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
  log_error "Database migration failed"
  exit 1
fi
log_success "Database migrations applied successfully"

# Seed database if required
if [ "$NODE_ENV" = "development" ] && [ "$SEED_DATABASE" = "true" ]; then
  log_info "Seeding database..."
  # Installiere bcryptjs-Typen, falls sie fehlen
  if [ ! -d "node_modules/@types/bcryptjs" ]; then
    log_info "Installing @types/bcryptjs..."
    npm install --save-dev @types/bcryptjs
  fi
  
  # Setze explizit die Node-Umgebungsvariablen für ts-node
  export TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"node"}'
  npx prisma db seed
  if [ $? -ne 0 ]; then
    log_error "Database seeding failed"
    log_info "Trying alternative seed method..."
    # Alternativer Seed-Versuch mit direkter ts-node-Ausführung
    npx ts-node --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' prisma/seed.ts
    if [ $? -ne 0 ]; then
      log_error "Alternative database seeding also failed"
      exit 1
    fi
  fi
  log_success "Database seeded successfully"
elif [ "$FORCE_SEED" = "true" ]; then
  log_info "Force seeding database..."
  # Installiere bcryptjs-Typen, falls sie fehlen
  if [ ! -d "node_modules/@types/bcryptjs" ]; then
    log_info "Installing @types/bcryptjs..."
    npm install --save-dev @types/bcryptjs
  fi
  
  # Setze explizit die Node-Umgebungsvariablen für ts-node
  export TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"node"}'
  npx prisma db seed
  if [ $? -ne 0 ]; then
    log_error "Force database seeding failed"
    log_info "Trying alternative seed method..."
    # Alternativer Seed-Versuch mit direkter ts-node-Ausführung
    npx ts-node --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' prisma/seed.ts
    if [ $? -ne 0 ]; then
      log_error "Alternative force database seeding also failed"
      exit 1
    fi
  fi
  log_success "Database force seeded successfully"
fi

# Start the application
log_info "Starting application in ${NODE_ENV} mode..."
exec "$@"
