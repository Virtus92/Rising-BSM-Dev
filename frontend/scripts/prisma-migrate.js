#!/usr/bin/env node

/**
 * Einfaches Migrations-Skript für Prisma
 * 
 * Dieses Skript wendet Prisma-Migrationen an und erstellt optional den Prisma-Client
 */

const { execSync } = require('child_process');

// Konsolenfarben für bessere Lesbarkeit
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

console.log(`${colors.yellow}Starte Prisma-Migrationen...${colors.reset}`);

try {
  // Prisma Client generieren
  console.log(`${colors.yellow}Generiere Prisma Client...${colors.reset}`);
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Migrationen anwenden
  console.log(`${colors.yellow}Wende Migrationen an...${colors.reset}`);
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log(`${colors.green}Migrationen erfolgreich angewendet!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Fehler beim Ausführen der Migrationen:${colors.reset}`, error);
  process.exit(1);
}
