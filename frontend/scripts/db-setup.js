#!/usr/bin/env node

/**
 * Datenbank-Setup-Skript für Frontend
 * 
 * Dieses Skript führt die initiale Datenbank-Einrichtung durch.
 * Es prüft ob die Datenbank existiert, erstellt sie bei Bedarf,
 * wendet Migrationen an und führt das Seeding durch.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Konsolen-Farben
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

// Lade .env.local oder .env Dateien
const envLocalPath = path.resolve('./.env.local');
const envPath = path.resolve('./.env');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function main() {
  try {
    console.log(`${colors.bright}${colors.yellow}🔧 Starte Datenbank-Setup...${colors.reset}`);
    
    // Prüfe, ob die Umgebungsvariablen vorhanden sind
    if (!process.env.DATABASE_URL) {
      console.error(`${colors.red}❌ DATABASE_URL fehlt in der .env-Datei${colors.reset}`);
      process.exit(1);
    }
    
    // Generiere Prisma-Client
    console.log(`${colors.yellow}🔧 Generiere Prisma-Client...${colors.reset}`);
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Wende bestehende Migrationen an oder erstelle initiale Migration
    console.log(`${colors.yellow}🔄 Wende Migrationen an...${colors.reset}`);
    
    // Versuche zunächst, bestehende Migrationen anzuwenden
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: "1" }
      });
    } catch (error) {
      console.log(`${colors.yellow}⚠️ Konnte bestehende Migrationen nicht anwenden. Erstelle initiale Migration...${colors.reset}`);
      
      try {
        execSync('npx prisma migrate dev --name initial_migration', { 
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: "1" }
        });
      } catch (migrationError) {
        console.log(`${colors.yellow}⚠️ Konnte keine Migration erstellen. Versuche direkten Schema-Push...${colors.reset}`);
        
        execSync('npx prisma db push', { 
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: "1" }
        });
      }
    }
    
    // Führe Datenbank-Seed aus
    console.log(`${colors.yellow}🌱 Führe Datenbank-Seed aus...${colors.reset}`);
    try {
      execSync('npx prisma db seed', { 
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: "1" }
      });
    } catch (seedError) {
      console.error(`${colors.red}❌ Fehler beim Seeding der Datenbank:${colors.reset}`, seedError);
      process.exit(1);
    }
    
    console.log(`${colors.green}✅ Datenbank-Setup erfolgreich abgeschlossen!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Unerwarteter Fehler beim Datenbank-Setup:${colors.reset}`, error);
    process.exit(1);
  }
}

// Führe die Hauptfunktion aus
main().catch(error => {
  console.error(`${colors.red}❌ Unbehandelter Fehler:${colors.reset}`, error);
  process.exit(1);
});
