#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script to fix Prisma client issues
 * 
 * This script:
 * 1. Checks for existence of prisma directory and schema
 * 2. Verifies package.json for correct dependencies
 * 3. Recreates the prisma client
 * 4. Verifies the client was generated correctly
 */

console.log('🔍 Starting Prisma client repair process...');

// Get project root
const projectRoot = path.resolve(__dirname, '..');
console.log(`📁 Project root: ${projectRoot}`);

// Check if prisma directory exists
const prismaDir = path.join(projectRoot, 'prisma');
if (!fs.existsSync(prismaDir)) {
  console.error('❌ Prisma directory not found! Creating it...');
  fs.mkdirSync(prismaDir, { recursive: true });
}

// Check if schema.prisma exists
const schemaPath = path.join(prismaDir, 'schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ schema.prisma not found!');
  process.exit(1);
}
console.log('✅ Found schema.prisma');

// Check package.json for prisma dependencies
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = require(packageJsonPath);

if (!packageJson.dependencies['@prisma/client']) {
  console.error('❌ @prisma/client not found in dependencies!');
  process.exit(1);
}
if (!packageJson.devDependencies.prisma) {
  console.error('❌ prisma not found in devDependencies!');
  process.exit(1);
}

console.log(`✅ Found @prisma/client version: ${packageJson.dependencies['@prisma/client']}`);
console.log(`✅ Found prisma devDependency version: ${packageJson.devDependencies.prisma}`);

// Create output directory structure if it doesn't exist
const outputDir = path.join(prismaDir, 'node_modules', '@prisma', 'client');
fs.mkdirSync(outputDir, { recursive: true });

// Run prisma generate
console.log('🔄 Running prisma generate...');
try {
  execSync('npx prisma generate', { stdio: 'inherit', cwd: projectRoot });
  console.log('✅ Prisma client generation completed successfully');
} catch (error) {
  console.error('❌ Error generating Prisma client:', error.message);
  process.exit(1);
}

// Verify the client was generated correctly
const indexJsPath = path.join(outputDir, 'index.js');
if (!fs.existsSync(indexJsPath)) {
  console.error('❌ Prisma client index.js not found after generation!');
  process.exit(1);
}
console.log(`✅ Verified Prisma client was generated at: ${indexJsPath}`);

// Check for error classes
const errorClassesPath = path.join(outputDir, 'runtime', 'library.js');
if (!fs.existsSync(errorClassesPath)) {
  console.warn('⚠️ Prisma error classes file not found at expected location!');
} else {
  console.log('✅ Found Prisma error classes');
}

// Function to remove a directory with platform-specific commands
function removeDirectory(dirPath) {
  try {
    if (process.platform === 'win32') {
      // Use rmdir on Windows
      if (fs.existsSync(dirPath)) {
        execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'inherit' });
      }
    } else {
      // Use rm -rf on Unix-based systems
      if (fs.existsSync(dirPath)) {
        execSync(`rm -rf "${dirPath}"`, { stdio: 'inherit' });
      }
    }
    return true;
  } catch (error) {
    console.warn(`⚠️ Error removing directory ${dirPath}:`, error.message);
    return false;
  }
}

// Clear node_modules/.cache if it exists
const cachePath = path.join(projectRoot, 'node_modules', '.cache');
if (fs.existsSync(cachePath)) {
  console.log('🧹 Clearing node_modules/.cache...');
  if (removeDirectory(cachePath)) {
    console.log('✅ Cache cleared');
  }
}

// Clear .next directory if it exists
const nextCachePath = path.join(projectRoot, '.next');
if (fs.existsSync(nextCachePath)) {
  console.log('🧹 Clearing .next cache...');
  if (removeDirectory(nextCachePath)) {
    console.log('✅ Next.js cache cleared');
  }
}

console.log('✅ Prisma client repair process completed successfully!');
console.log('\n🚀 Next steps:');
console.log('1. Run "npm run dev" to start the Next.js development server');
console.log('2. If issues persist, try running "npm install" followed by "npm run prisma:generate"');
