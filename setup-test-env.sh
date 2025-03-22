#!/bin/bash

# Stop any running test containers
docker-compose -f docker-compose.test.yml down

# Start the test database
docker-compose -f docker-compose.test.yml up -d test-db

# Wait for database to be ready
echo "Waiting for test database to be ready..."
sleep 10

# Run migrations and seed the database
echo "Setting up test database..."
cd backend
npx prisma migrate reset --force
npx prisma db seed

echo "Test environment setup complete!"