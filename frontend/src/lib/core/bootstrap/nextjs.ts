/**
 * NextJS-spezifischer Bootstrapper
 * 
 * Diese Datei adaptiert den Express-Bootstrapper für die Verwendung in NextJS.
 * Sie initialisiert alle erforderlichen Dienste und Repositories für API-Routen.
 */
import { getLoggingService } from '../../services/factory';
import { bootstrap as expressBootstrap } from '../Bootstrapper';
import container from '../DiContainer';

// Cache für initialisierten Status
let initialized = false;

/**
 * Bootstrapping für NextJS
 * 
 * Initialisiert den DI-Container und alle erforderlichen Dienste für NextJS-API-Routen.
 * Ruft den ursprünglichen Bootstrapper auf, aktualisiert aber die Express-spezifischen Teile.
 * 
 * @returns Initialisierter DI-Container
 */
export function bootstrap() {
  // Vermeiden doppelter Initialisierung
  if (initialized) {
    return container;
  }
  
  const logger = getLoggingService();
  logger.info('NextJS-Bootstrapper wird gestartet...');
  
  try {
    // Express-Bootstrapper verwenden, um Grunddienste zu initialisieren
    expressBootstrap();
    
    // NextJS-spezifische Anpassungen hier hinzufügen
    logger.info('NextJS-spezifische Konfiguration wird angewendet...');
    
    // Als initialisiert markieren
    initialized = true;
    
    logger.info('NextJS-Bootstrapper erfolgreich abgeschlossen');
    return container;
  } catch (error) {
    logger.error(`NextJS-Bootstrapper fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    throw error;
  }
}

/**
 * Herunterfahren und Ressourcen freigeben
 */
export async function shutdown() {
  const logger = getLoggingService();
  logger.info('NextJS-Backend wird heruntergefahren...');
  
  try {
    // Prisma-Client trennen
    const prisma = container.resolve('PrismaClient');
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
      logger.info('Datenbankverbindung getrennt');
    }
    
    // Container zurücksetzen
    container.reset();
    initialized = false;
    
    logger.info('NextJS-Backend erfolgreich heruntergefahren');
    return true;
  } catch (error) {
    logger.error(`Fehler beim Herunterfahren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    return false;
  }
}