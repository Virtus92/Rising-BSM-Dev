#!/usr/bin/env node

/**
 * Automatisches Migrations-Skript
 * 
 * Dieses Skript prüft, ob Tabellen in der Datenbank existieren und erstellt
 * automatisch Migrationen, wenn nötig.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Konfiguration
const PRISMA_SCHEMA_PATH = path.resolve('./prisma/schema.prisma');
const MIGRATIONS_DIR = path.resolve('./prisma/migrations');
const MIGRATION_NAME = 'auto_migration';

// Erstelle initiale Migrationen und wende sie direkt an
async function createInitialMigration() {
  try {
    console.log('🔄 Erstelle initiale Migration...');
    
    // Versuche direkt eine Migration zu erstellen und anzuwenden
    try {
      execSync('npx prisma migrate dev --name initial', {
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: "1" }
      });
      return true;
    } catch (error) {
      console.error('⚠️ Fehler bei der Erstellung der initialen Migration:', error.message);
      
      // Versuche eine Schema-Push als Alternative (nicht für Produktion empfohlen)
      try {
        console.log('🔄 Versuche direkten Schema-Push...');
        execSync('npx prisma db push', {
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: "1" }
        });
        return true;
      } catch (pushError) {
        console.error('⚠️ Auch Schema-Push fehlgeschlagen:', pushError.message);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Unerwarteter Fehler bei der Migration:', error);
    return false;
  }
}

// Prüfen ob Tabellen existieren mit einer SQL-Abfrage
function checkTablesExist() {
  try {
    // Extrahieren der Datenbank-URL aus der Umgebungsvariable
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL Umgebungsvariable nicht gefunden');
      return false;
    }

    console.log('🔍 Prüfe, ob Datenbank-Tabellen existieren...');

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
        console.log('✅ Wichtige Tabellen existieren bereits');
        return true;
      } else {
        console.log('⚠️ Wichtige Tabellen fehlen');
        return false;
      }
    } catch (error) {
      console.error('⚠️ Fehler beim Prüfen der Tabellen:', error.message);
      if (error.stderr) console.error(error.stderr);
      return false;
    }
  } catch (error) {
    console.error('⚠️ Fehler beim Prüfen der Tabellen:', error);
    return false;
  }
}

// Hauptfunktion
async function main() {
  try {
    // Generiere zuerst den Prisma-Client (falls nicht bereits geschehen)
    console.log('🔧 Generiere Prisma-Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Prüfe, ob die Tabellen bereits existieren
    const tablesExist = checkTablesExist();
    
    if (!tablesExist) {
      console.log('🔄 Tabellen nicht gefunden. Führe Migration durch...');
      
      // Prüfe, ob Migrations-Verzeichnis existiert und Dateien enthält
      const hasMigrations = fs.existsSync(MIGRATIONS_DIR) && 
                          fs.readdirSync(MIGRATIONS_DIR).length > 0;
      
      if (hasMigrations) {
        console.log('🔄 Migrationen existieren bereits. Wende sie an...');
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: "1" }
        });
      } else {
        console.log('🔄 Keine Migrationen gefunden. Erstelle initiale Migration...');
        // Versuche es mit direktem Schema-Push
        const success = await createInitialMigration();
        if (!success) {
          console.error('❌ Konnte keine Tabellen erstellen');
          process.exit(1);
        }
      }
      
      console.log('✅ Migration erfolgreich angewendet');
    } else {
      // Prüfe auf ausstehende Migrationen
      console.log('🔍 Prüfe auf ausstehende Migrationen...');
      
      try {
        // Führe einen Dry-Run durch, um zu sehen, ob Änderungen am Schema vorliegen
        const result = execSync('npx prisma migrate dev --create-only --name test', { 
          stdio: 'pipe', 
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: "1" }
        });
        
        if (result.includes('No migration was created') || 
            result.includes('already in sync with your Prisma schema')) {
          console.log('✅ Datenbank-Schema ist aktuell. Keine Migration erforderlich.');
        } else {
          console.log('🔄 Schema-Änderungen erkannt. Erstelle Migration...');
          
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
          
          console.log('✅ Migration erfolgreich erstellt und angewendet.');
        }
      } catch (error) {
        if (error.stdout && (
          error.stdout.includes('already in sync with your Prisma schema') ||
          error.stdout.includes('No migration was created')
        )) {
          console.log('✅ Datenbank-Schema ist aktuell. Keine Migration erforderlich.');
        } else {
          console.error('⚠️ Fehler bei der Prüfung auf Migrationen:', error);
          console.log('🔄 Versuche direkte Migration...');
          
          execSync(`npx prisma migrate dev --name ${MIGRATION_NAME}`, { 
            stdio: 'inherit',
            env: { ...process.env, FORCE_COLOR: "1" }
          });
          
          console.log('✅ Direkte Migration erfolgreich angewendet.');
        }
      }
    }
  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
    process.exit(1);
  }
}

// Führe die Hauptfunktion aus
main().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error);
  process.exit(1);
});
