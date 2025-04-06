/**
 * NextJS API-Initialisierung
 * 
 * Diese Datei bietet eine zentrale Initialisierung für alle NextJS-API-Routen.
 * Sie stellt sicher, dass der DI-Container und alle erforderlichen Dienste initialisiert sind.
 */
import { bootstrap, shutdown } from './core/bootstrap/nextjs';
import { getLoggingService } from './services/factory';
import config from './config';

// Initialisierungsstatus
let initialized = false;

/**
 * Initialisiert die API für NextJS
 * 
 * @returns Erfolgsstatus
 */
export async function initNextApi(): Promise<boolean> {
  // Vermeiden doppelter Initialisierung
  if (initialized) {
    return true;
  }
  
  try {
    const logger = getLoggingService();
    logger.info('NextJS API wird initialisiert...');
    
    // Bootstrap durchführen
    bootstrap();
    
    // Als initialisiert markieren
    initialized = true;
    
    // Shutdown-Handler registrieren (nur im Serverkontext)
    if (typeof process !== 'undefined' && process.on) {
      process.on('SIGTERM', async () => {
        logger.info('SIGTERM erhalten, API wird heruntergefahren...');
        await shutdown();
        process.exit(0);
      });
      
      process.on('SIGINT', async () => {
        logger.info('SIGINT erhalten, API wird heruntergefahren...');
        await shutdown();
        process.exit(0);
      });
    }
    
    logger.info(`NextJS API erfolgreich initialisiert (Umgebung: ${config.NODE_ENV})`);
    return true;
  } catch (error) {
    console.error('Fehler bei der API-Initialisierung:', error);
    return false;
  }
}

/**
 * API herunterfahren
 */
export async function shutdownNextApi(): Promise<boolean> {
  if (!initialized) {
    return true;
  }
  
  try {
    await shutdown();
    initialized = false;
    return true;
  } catch (error) {
    console.error('Fehler beim Herunterfahren der API:', error);
    return false;
  }
}