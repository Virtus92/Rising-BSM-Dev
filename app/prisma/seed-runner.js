// Direct ESM seed runner - no ts-node dependency

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

// Define the executable and arguments based on platform
const isProd = process.env.NODE_ENV === 'production';
const isWindows = process.platform === 'win32';

// Check required dependencies
const requiredPackages = ['@faker-js/faker', 'dotenv', 'bcryptjs'];
for (const pkg of requiredPackages) {
  const packagePath = join(__dirname, '..', 'node_modules', pkg);
  if (!existsSync(packagePath)) {
    console.error(`Missing required package: ${pkg}`);
    console.log('Installing missing packages...');
    require('child_process').execSync('npm install --no-save @faker-js/faker dotenv bcryptjs', {
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    });
    break;
  }
}

// Run the prisma db seed command
console.log('🌱 Starting database seeding...');

// Create a child process to run the seed
const seedProcess = spawn('npx', ['prisma', 'db', 'seed'], {
  cwd: join(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

// Handle the result
seedProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Database seeding completed successfully');
  } else {
    console.error(`❌ Database seeding failed with code ${code}`);
    process.exit(code);
  }
});
