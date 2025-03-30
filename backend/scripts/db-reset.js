#!/usr/bin/env node

/**
 * Datenbank-Reset-Skript
 * 
 * Dieses Skript löscht alle Tabellen in der Datenbank und wendet dann die Migrationen neu an.
 * WARNUNG: Dies ist ein destruktiver Vorgang, der alle Daten in der Datenbank löscht!
 */

import { execSync } from 'child_process';

console.log('⚠️ WARNUNG: Dieses Skript wird alle Daten in der Datenbank löschen!');
console.log('Drücken Sie STRG+C innerhalb von 5 Sekunden, um abzubrechen...');

// 5 Sekunden warten, damit der Benutzer abbrechen kann
setTimeout(() => {
  console.log('🔄 Starte Datenbank-Reset...');
  
  try {
    // Prisma-Schema zurücksetzen und Datenbank leeren
    console.log('🗑️ Lösche Datenbank...');
    execSync('npx prisma migrate reset --force', { 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: "1" }
    });
    
    // Neuen Prisma-Client generieren
    console.log('🔧 Generiere Prisma-Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Datenbank-Seed ausführen
    console.log('🌱 Führe Datenbank-Seed aus...');
    execSync('npx tsx prisma/seed.ts', { 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: "1" }
    });
    
    console.log('✅ Datenbank erfolgreich zurückgesetzt!');
  } catch (error) {
    console.error('❌ Fehler beim Zurücksetzen der Datenbank:', error);
    process.exit(1);
  }
}, 5000);
