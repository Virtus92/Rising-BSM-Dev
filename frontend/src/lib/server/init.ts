/**
 * Server-Initialisierungsdatei
 * 
 * Diese Datei initialisiert die Server-Komponenten frühzeitig,
 * um sicherzustellen, dass der DI-Container und andere wichtige
 * Dienste vor der Verarbeitung von API-Anfragen bereit sind.
 * 
 * Diese Datei sollte als erstes in API-Routes importiert werden.
 */

import { container } from './di-container';
import { LogLevel } from './interfaces/ILoggingService';

/**
 * Initialisiert die Server-Komponenten
 */
(function initializeServer() {
  try {
    // Stelle sicher, dass der Container initialisiert ist
    if (!container.isInitialized()) {
      container.initialize();
    }
    
    // Hole den Logger und protokolliere erfolgreiche Initialisierung
    const logger = container.resolve('LoggingService');
    logger.info('Server-Komponenten erfolgreich initialisiert', {
      containerId: container.getInstanceId(),
      environment: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || LogLevel.INFO
    });
  } catch (error) {
    console.error('Fehler bei der Server-Initialisierung:', error);
  }
})();

// Exportiere den Container für direkten Zugriff
export { container };
