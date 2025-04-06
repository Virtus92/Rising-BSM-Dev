/**
 * Diagnose-Tool für den DI-Container
 * 
 * Dieses Script prüft den Zustand des DI-Containers und gibt 
 * detaillierte Informationen über registrierte Services und
 * mögliche Probleme aus.
 */

require('dotenv').config();

// Setze Next.js-Umgebungsvariablen für Test
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Importiere notwendige Module
const path = require('path');
const fs = require('fs');

console.log('DI-Container Diagnose-Tool');
console.log('==========================\n');

console.log('Umgebung:', process.env.NODE_ENV);
console.log('Log-Level:', process.env.LOG_LEVEL || 'INFO');
console.log('\nInitialisiere Container...\n');

// Importiere den DI-Container
try {
  // Lade den Container dynamisch
  require('@babel/register')({
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      '@babel/preset-typescript'
    ],
    plugins: [
      ['module-resolver', {
        alias: {
          '@': path.resolve(__dirname, '../src')
        }
      }]
    ],
    extensions: ['.js', '.ts']
  });
  
  // Import Module
  const { DIContainer } = require('../src/lib/server/di-container');
  
  // Container erstellen und initialisieren
  const container = DIContainer.getInstance();
  console.log('Container-ID:', container.getInstanceId());
  console.log('Initialisiert:', container.isInitialized());
  
  if (!container.isInitialized()) {
    console.log('Initialisiere Container...');
    container.initialize();
    console.log('Initialisierung abgeschlossen.');
  }
  
  // Verfügbare Services auflisten
  console.log('\nVerfügbare Services:');
  console.log('------------------');
  
  // Holen Services über Reflexion (nicht offizieller Weg)
  const services = container.has ? 
    Array.from(Object.getOwnPropertyNames(container))
      .filter(prop => typeof container[prop] === 'object' && container[prop] !== null)
      .map(prop => {
        if (prop === 'services' && container[prop] instanceof Map) {
          return Array.from(container[prop].keys());
        }
        return [];
      })
      .flat() :
    [];
  
  if (services.length > 0) {
    services.sort().forEach(service => {
      try {
        const instance = container.resolve(service);
        const type = instance.constructor.name;
        console.log(`- ${service} (${type})`);
      } catch (error) {
        console.log(`- ${service} [ERROR: ${error.message}]`);
      }
    });
  } else {
    console.log('Keine Services gefunden oder keine Zugriffsmöglichkeit auf interne Map.');
    console.log('Teste bekannte Services:');
    
    // Liste potenzieller Services
    const potentialServices = [
      'LoggingService',
      'PrismaClient',
      'ErrorHandler',
      'ValidationService',
      'UserRepository',
      'AuthService'
    ];
    
    potentialServices.forEach(service => {
      try {
        const instance = container.resolve(service);
        console.log(`- ${service} (${instance.constructor.name})`);
      } catch (error) {
        console.log(`- ${service} [NICHT GEFUNDEN]`);
      }
    });
  }
  
  // Weitere Diagnose
  console.log('\nContainer-Diagnose:');
  console.log('-----------------');
  
  // Logger-Verfügbarkeit testen
  try {
    const logger = container.resolve('LoggingService');
    console.log('✅ LoggingService ist verfügbar');
    
    // Test-Log schreiben
    logger.info('DI-Container-Diagnose durchgeführt');
  } catch (error) {
    console.log('❌ LoggingService ist NICHT verfügbar:', error.message);
  }
  
  // Datenbankverbindung testen
  try {
    const prisma = container.resolve('PrismaClient');
    console.log('✅ PrismaClient ist verfügbar');
    console.log('Versuche, Datenbankverbindung zu testen...');
    
    Promise.resolve()
      .then(() => prisma.$queryRaw`SELECT 1`)
      .then(() => {
        console.log('✅ Datenbankverbindung erfolgreich getestet');
      })
      .catch(err => {
        console.log('❌ Datenbankverbindung fehlgeschlagen:', err.message);
      });
  } catch (error) {
    console.log('❌ PrismaClient ist NICHT verfügbar:', error.message);
  }
  
  console.log('\nDiagnose abgeschlossen.');
  
} catch (error) {
  console.error('Fehler beim Laden des DI-Containers:', error);
  console.error('Stack:', error.stack);
}
