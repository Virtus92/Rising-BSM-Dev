#!/bin/sh
set -e

# Helper function to check if a package is installed
check_package() {
  if ! npm list --prefix /app "$1" >/dev/null 2>&1; then
    echo "Package $1 is not installed. Installing..."
    npm install --no-save "$1"
    return 1
  fi
  return 0
}

# Ensure required packages are available
echo "Checking required dependencies..."
check_package "@faker-js/faker" || true
check_package "dotenv" || true
check_package "bcryptjs" || true
check_package "ts-node" || true

# Run the seed directly
echo "🌱 Starting database seeding..."
cd /app
NODE_PATH=/app/node_modules:/usr/local/lib/node_modules npx ts-node prisma/seed.ts

# Check result
if [ $? -eq 0 ]; then
  echo "✅ Database seeding completed successfully"
else
  echo "❌ Database seeding failed"
  exit 1
fi
