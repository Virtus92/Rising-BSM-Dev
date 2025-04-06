/**
 * Anwendungsinitialisierung für API und Backend-Dienste
 * 
 * Diese Datei dient als Ersatz für den Bootstrapper und die Server-Initialisierung
 * aus der Express-Version und passt sie für NextJS an.
 */
import { PrismaClient } from '@prisma/client';
import { getLoggingService } from './services/factory';

// Singleton Prisma-Instanz
let prisma: PrismaClient | undefined;

/**
 * Initialisiert die Backend-Dienste für die Next.js-Anwendung
 * 
 * @returns True, wenn die Initialisierung erfolgreich war
 */
export async function initializeBackend(): Promise<boolean> {
  const logger = getLoggingService();
  logger.info('Backend-Dienste werden initialisiert...');
  
  try {
    // Initialisiere Prisma
    if (!prisma) {
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'error', 'warn'] 
          : ['error'],
      });
      
      // Stelle eine Verbindung zur Datenbank her
      await prisma.$connect();
      logger.info('Datenbankverbindung hergestellt');
    }
    
    // Initialisiere die API-Bibliothek
    await import('./index').then(({ initializeApi }) => {
      initializeApi();
      logger.info('API-Bibliothek initialisiert');
    });
    
    logger.info('Backend-Dienste erfolgreich initialisiert');
    return true;
  } catch (error) {
    logger.error(`Backend-Initialisierung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

/**
 * Gibt die Prisma-Instanz zurück
 * 
 * @returns Prisma-Client-Instanz
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    throw new Error('Prisma wurde noch nicht initialisiert. Rufen Sie zuerst initializeBackend() auf.');
  }
  return prisma;
}

/**
 * Herunterfahren der Backend-Dienste
 */
export async function shutdownBackend(): Promise<boolean> {
  const logger = getLoggingService();
  logger.info('Backend-Dienste werden heruntergefahren...');
  
  try {
    if (prisma) {
      await prisma.$disconnect();
      logger.info('Datenbankverbindung getrennt');
    }
    
    logger.info('Backend-Dienste erfolgreich heruntergefahren');
    return true;
  } catch (error) {
    logger.error(`Backend-Herunterfahren fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}