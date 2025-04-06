const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

console.log(`${colors.bright}${colors.yellow}Starting Prisma Setup...${colors.reset}`);

// Function to execute commands and handle errors
function runCommand(command, errorMessage) {
  try {
    console.log(`${colors.yellow}Running: ${command}${colors.reset}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}${errorMessage}${colors.reset}`);
    console.error(`${colors.red}Error details: ${error.message}${colors.reset}`);
    return false;
  }
}

// Function to check if node_modules exists for @prisma/client
function checkPrismaClientInstalled() {
  const prismaClientPath = path.join(__dirname, 'node_modules', '@prisma', 'client');
  return fs.existsSync(prismaClientPath);
}

// Check if Prisma is already installed, otherwise install it
if (!checkPrismaClientInstalled()) {
  console.log(`${colors.yellow}Prisma client not found in node_modules. Installing...${colors.reset}`);
  if (!runCommand('npm install @prisma/client@5.7.0 --save', 'Failed to install @prisma/client')) {
    process.exit(1);
  }
  if (!runCommand('npm install prisma@5.7.0 --save-dev', 'Failed to install prisma dev dependency')) {
    process.exit(1);
  }
} else {
  console.log(`${colors.green}Prisma client already installed.${colors.reset}`);
}

// Clean up generated files to start fresh
console.log(`${colors.yellow}Cleaning up any existing Prisma generated files...${colors.reset}`);
const nodePrismaPath = path.join(__dirname, 'node_modules', '.prisma');
if (fs.existsSync(nodePrismaPath)) {
  try {
    fs.rmSync(nodePrismaPath, { recursive: true, force: true });
    console.log(`${colors.green}Successfully removed ${nodePrismaPath}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to remove ${nodePrismaPath}: ${error.message}${colors.reset}`);
  }
}

// Generate Prisma client
if (!runCommand('npx prisma generate', 'Failed to generate Prisma client')) {
  process.exit(1);
}

console.log(`${colors.bright}${colors.green}Prisma setup completed successfully!${colors.reset}`);
console.log(`${colors.yellow}Next steps:${colors.reset}`);
console.log(`${colors.yellow}1. Run 'npm run dev' to start your Next.js application${colors.reset}`);
console.log(`${colors.yellow}2. If you need to set up the database schema, run 'npx prisma migrate dev'${colors.reset}`);
console.log(`${colors.yellow}3. To seed the database, run 'npx prisma db seed'${colors.reset}`);
