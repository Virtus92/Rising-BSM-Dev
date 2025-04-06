import { PrismaClient } from '@prisma/client';

// Typdefinition für den globalen Namespace
declare global {
  var prisma: PrismaClient | undefined;
}

// Prisma Client Singleton mit verbesserter Fehlerbehändlung
function getPrismaClient(): PrismaClient {
  try {
    // Verwende eine globale Variable in Entwicklung, um Hot Reloading zu unterstützen
    if (process.env.NODE_ENV === 'development') {
      if (!global.prisma) {
        global.prisma = new PrismaClient({
          log: ['error', 'warn', 'query'],
          errorFormat: 'pretty',
        });
        console.log('Neue PrismaClient-Instanz erstellt (Development)');
      }
      return global.prisma;
    }
    
    // In Produktion eine neue Instanz erstellen
    // Da Next.js in Produktion nur einmal initialisiert wird, wird dies auch nur einmal aufgerufen
    return new PrismaClient({
      log: ['error'],
      errorFormat: 'minimal',
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des PrismaClient:', error);
    // Fallback-Instanz erstellen, falls die Hauptinstanz fehlschlägt
    return new PrismaClient({
      log: ['error'],
      errorFormat: 'minimal',
    });
  }
}

// PrismaClient initialisieren
const prisma = getPrismaClient();

// Verbindung testen und Fehler abfangen
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Datenbankverbindung erfolgreich hergestellt');
  } catch (error) {
    console.error('Fehler bei der Datenbankverbindung:', error);
    // Hier könnten Wiederverbindungsversuche erfolgen
  }
}

// Verbindung im Hintergrund testen, ohne das Modul zu blockieren
testConnection().catch(console.error);

export default prisma;
