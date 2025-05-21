/**
 * This script ensures Prisma Client is correctly generated during Vercel builds
 * It handles the edge case where Vercel's dependency caching prevents proper generation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if we're running in a Vercel build environment
const isVercelBuild = process.env.VERCEL === '1';

if (isVercelBuild) {
  console.log('🔍 Detected Vercel build environment');
  
  // Path to the generated Prisma client
  const prismaClientPath = path.join(
    __dirname, 
    '..',
    'node_modules',
    '.prisma',
    'client'
  );
  
  // Check if Prisma client exists
  const prismaClientExists = fs.existsSync(prismaClientPath);
  
  if (!prismaClientExists) {
    console.log('⚠️ Prisma Client not found, generating...');
    try {
      // Generate Prisma client
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma Client generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate Prisma Client:', error);
      process.exit(1);
    }
  } else {
    console.log('✅ Prisma Client already exists');
  }
}
