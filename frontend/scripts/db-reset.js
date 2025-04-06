#!/usr/bin/env node

/**
 * Datenbank-Reset-Skript für Frontend
 * 
 * Dieses Skript löscht alle Tabellen in der Datenbank und wendet dann die Migrationen neu an.
 * WARNUNG: Dies ist ein destruktiver Vorgang, der alle Daten in der Datenbank löscht!
 */

import { execSync } from 'child_process';

// Konsolen-Farben
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

console.log(`${colors.bright}${colors.red}⚠️ WARNUNG: Dieses Skript wird alle Daten in der Datenbank löschen!${colors.reset}`);
console.log(`${colors.yellow}Drücken Sie STRG+C innerhalb von 5 Sekunden, um abzubrechen...${colors.reset}`);

// 5 Sekunden warten, damit der Benutzer abbrechen kann
setTimeout(() => {
  console.log(`${colors.yellow}🔄 Starte Datenbank-Reset...${colors.reset}`);
  
  try {
    // Prisma-Schema zurücksetzen und Datenbank leeren
    console.log(`${colors.yellow}🗑️ Lösche Datenbank...${colors.reset}`);
    execSync('npx prisma migrate reset --force', { 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: "1" }
    });
    
    // Neuen Prisma-Client generieren
    console.log(`${colors.yellow}🔧 Generiere Prisma-Client...${colors.reset}`);
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Datenbank-Seed ausführen
    console.log(`${colors.yellow}🌱 Führe Datenbank-Seed aus...${colors.reset}`);
    execSync('npx prisma db seed', { 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: "1" }
    });
    
    console.log(`${colors.green}✅ Datenbank erfolgreich zurückgesetzt!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Fehler beim Zurücksetzen der Datenbank:${colors.reset}`, error);
    process.exit(1);
  }
}, 5000);
