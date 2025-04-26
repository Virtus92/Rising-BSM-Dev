#!/usr/bin/env node

// Simple wrapper to execute the seed script with proper TypeScript support
// This is more reliable in Docker environments than relying on ts-node directly

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  console.log('🌱 Starting database seeding...');
  
  // First, make sure the dependencies are installed locally for the seed script
  console.log('Installing required dependencies for seeding...');
  execSync(
    'npm install --no-save dotenv @faker-js/faker bcryptjs',
    {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    }
  );
  
  // Run the seed script with ts-node
  console.log('Executing seed script...');
  execSync(
    'npx ts-node --compiler-options "{\\\"module\\\":\\\"CommonJS\\\",\\\"moduleResolution\\\":\\\"node\\\"}" prisma/seed.ts',
    {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    }
  );
  
  console.log('✅ Database seeding completed successfully');
} catch (error) {
  console.error('❌ Database seeding failed:', error as Error);
  process.exit(1);
}
