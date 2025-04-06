#!/usr/bin/env node

/**
 * Automatisches Migrations-Skript für Frontend
 * 
 * Dieses Skript prüft, ob Tabellen in der Datenbank existieren und erstellt
 * automatisch Migrationen, wenn nötig.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Lade .env.local oder .env-Datei
const envLocalPath = path.resolve('./env.local');
const envPath = path.resolve('./.env');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Konfiguration
const PRISMA_SCHEMA_PATH = path.resolve('./prisma/schema.prisma');
const MIGRATIONS_DIR = path.resolve('./prisma/migrations');
const MIGRATION_NAME = 'auto_migration';

// Konsolen-Farben
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

// Erstelle initiale Migrationen und wende sie direkt an
async function createInitialMigration() {
  try {
    console.log(`${colors.yellow}🔄 Erstelle initiale Migration...${colors.reset}`);
    
    // Versuche direkt eine Migration zu erstellen und anzuwenden
    try {
      execSync('npx prisma migrate dev --name initial', {
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: "1" }
      });
      return true;
    } catch (error) {
      console.error(`${colors.red}⚠️ Fehler bei der Erstellung der initialen Migration:${colors.reset}`, error.message);
      
      // Versuche eine Schema-Push als Alternative
      try {
        console.log(`${colors.yellow}🔄 Versuche direkten Schema-Push...${colors.reset}`);
        execSync('npx prisma db push', {
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: "1" }
        });
        return true;
      } catch (pushError) {
        console.error(`${colors.red}⚠️ Auch Schema-Push fehlgeschlagen:${colors.reset}`, pushError.message);
        return false;
      }
    }
  } catch (error) {
    console.error(`${colors.red}❌ Unerwarteter Fehler bei der Migration:${colors.reset}`, error);
    return false;
  }
}

// Prüfen ob Tabellen existieren mit einer SQL-Abfrage
function checkTablesExist() {
  try {
    // Extrahieren der Datenbank-URL aus der Umgebungsvariable
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error(`${colors.red}❌ DATABASE_URL Umgebungsvariable nicht gefunden${colors.reset}`);
      return false;
    }

    console.log(`${colors.yellow}🔍 Prüfe, ob Datenbank-Tabellen existieren...${colors.reset}`);

    // Führe eine SQL-Abfrage durch, die prüft, ob wichtige Tabellen existieren
    const cmd = `npx prisma db execute --stdin`;
    const sqlQuery = `
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'User'
      );
    `;

    // Führe die Anfrage aus und prüfe das Ergebnis
    try {
      const result = execSync(cmd, {
        input: sqlQuery,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Prüfe das Ergebnis (sollte "t" für true oder "f" für false enthalten)
      if (result.includes('t')) {
        console.log(`${colors.green}✅ Wichtige Tabellen existieren bereits${colors.reset}`);
        return true;
      } else {
        console.log(`${colors.yellow}⚠️ Wichtige Tabellen fehlen${colors.reset}`);
        return false;
      }
    } catch (error) {
      console.error(`${colors.red}⚠️ Fehler beim Prüfen der Tabellen:${colors.reset}`, error.message);
      if (error.stderr) console.error(error.stderr);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}⚠️ Fehler beim Prüfen der Tabellen:${colors.reset}`, error);
    return false;
  }
}

// Hauptfunktion
async function main() {
  try {
    // Generiere zuerst den Prisma-Client (falls nicht bereits geschehen)
    console.log(`${colors.yellow}🔧 Generiere Prisma-Client...${colors.reset}`);
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Prüfe, ob die Tabellen bereits existieren
    const tablesExist = checkTablesExist();
    
    if (!tablesExist) {
      console.log(`${colors.yellow}🔄 Tabellen nicht gefunden. Führe Migration durch...${colors.reset}`);
      
      // Prüfe, ob Migrations-Verzeichnis existiert und Dateien enthält
      const hasMigrations = fs.existsSync(MIGRATIONS_DIR) && 
                          fs.readdirSync(MIGRATIONS_DIR).length > 0;
      
      if (hasMigrations) {
        console.log(`${colors.yellow}🔄 Migrationen existieren bereits. Wende sie an...${colors.reset}`);
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: "1" }
        });
      } else {
        console.log(`${colors.yellow}🔄 Keine Migrationen gefunden. Erstelle initiale Migration...${colors.reset}`);
        // Versuche es mit direktem Schema-Push
        const success = await createInitialMigration();
        if (!success) {
          console.error(`${colors.red}❌ Konnte keine Tabellen erstellen${colors.reset}`);
          process.exit(1);
        }
      }
      
      console.log(`${colors.green}✅ Migration erfolgreich angewendet${colors.reset}`);
    } else {
      // Prüfe auf ausstehende Migrationen
      console.log(`${colors.yellow}🔍 Prüfe auf ausstehende Migrationen...${colors.reset}`);
      
      try {
        // Führe einen Dry-Run durch, um zu sehen, ob Änderungen am Schema vorliegen
        const result = execSync('npx prisma migrate dev --create-only --name test', { 
          stdio: 'pipe', 
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: "1" }
        });
        
        if (result.includes('No migration was created') || 
            result.includes('already in sync with your Prisma schema')) {
          console.log(`${colors.green}✅ Datenbank-Schema ist aktuell. Keine Migration erforderlich.${colors.reset}`);
        } else {
          console.log(`${colors.yellow}🔄 Schema-Änderungen erkannt. Erstelle Migration...${colors.reset}`);
          
          // Löschen der temporären Test-Migration
          const migrationDirs = fs.readdirSync(MIGRATIONS_DIR);
          const testMigration = migrationDirs.find(dir => dir.includes('test'));
          if (testMigration) {
            fs.rmSync(path.join(MIGRATIONS_DIR, testMigration), { recursive: true, force: true });
          }
          
          // Erstelle die tatsächliche Migration
          execSync(`npx prisma migrate dev --name ${MIGRATION_NAME}`, { 
            stdio: 'inherit',
            env: { ...process.env, FORCE_COLOR: "1" }
          });
          
          console.log(`${colors.green}✅ Migration erfolgreich erstellt und angewendet.${colors.reset}`);
        }
      } catch (error) {
        if (error.stdout && (
          error.stdout.includes('already in sync with your Prisma schema') ||
          error.stdout.includes('No migration was created')
        )) {
          console.log(`${colors.green}✅ Datenbank-Schema ist aktuell. Keine Migration erforderlich.${colors.reset}`);
        } else {
          console.error(`${colors.red}⚠️ Fehler bei der Prüfung auf Migrationen:${colors.reset}`, error);
          console.log(`${colors.yellow}🔄 Versuche direkte Migration...${colors.reset}`);
          
          execSync(`npx prisma migrate dev --name ${MIGRATION_NAME}`, { 
            stdio: 'inherit',
            env: { ...process.env, FORCE_COLOR: "1" }
          });
          
          console.log(`${colors.green}✅ Direkte Migration erfolgreich angewendet.${colors.reset}`);
        }
      }
    }
  } catch (error) {
    console.error(`${colors.red}❌ Unerwarteter Fehler:${colors.reset}`, error);
    process.exit(1);
  }
}

// Führe die Hauptfunktion aus
main().catch(error => {
  console.error(`${colors.red}❌ Unbehandelter Fehler:${colors.reset}`, error);
  process.exit(1);
});
