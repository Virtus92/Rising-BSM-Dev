#!/usr/bin/env node

/**
 * Direktes Seed-Skript für Docker-Umgebungen
 * 
 * Dieses Skript führt das Seeding direkt mit ts-node aus, mit den richtigen Compiler-Optionen.
 * Es kann verwendet werden, wenn das reguläre `npx prisma db seed` fehlschlägt.
 */

const { execSync } = require('child_process');

console.log('Starting direct database seeding...');

try {
  // Stelle sicher, dass @types/bcryptjs installiert ist
  try {
    require.resolve('@types/bcryptjs');
    console.log('@types/bcryptjs is already installed');
  } catch (e) {
    console.log('Installing @types/bcryptjs...');
    execSync('npm install --save-dev @types/bcryptjs', { stdio: 'inherit' });
  }

  // Führe Seed-Skript direkt mit ts-node aus
  execSync(
    'npx ts-node --compiler-options \'{"module":"CommonJS","moduleResolution":"node"}\' prisma/seed.ts',
    { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        TS_NODE_COMPILER_OPTIONS: '{"module":"CommonJS","moduleResolution":"node"}'
      }
    }
  );
  
  console.log('Direct database seeding completed successfully!');
} catch (error) {
  console.error('Error during direct database seeding:', error);
  process.exit(1);
}
