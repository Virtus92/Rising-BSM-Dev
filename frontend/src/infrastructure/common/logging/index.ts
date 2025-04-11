/**
 * Zentrale Logging-Funktionalität
 * 
 * Isoliertes Modul für Logger-Initialisierung, das nicht von anderen Modulen abhängt
 * (um zirkuläre Abhängigkeiten zu vermeiden)
 */

import { LoggingService, LogLevel, LogFormat } from './LoggingService';
import type { ILoggingService } from './ILoggingService';

// Singleton-Instanz
let logger: ILoggingService;

/**
 * Gibt eine Singleton-Instanz des LoggingService zurück
 */
export function getLogger(): ILoggingService {
  if (!logger) {
    // Konfiguriere den Logger basierend auf der Umgebung
    const isDevelopment = process.env.NODE_ENV === 'development';
    logger = new LoggingService({
      level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
      format: isDevelopment ? LogFormat.PRETTY : LogFormat.JSON,
      labels: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
        application: 'Rising-BSM-Frontend'
      }
    });
  }
  return logger;
}

/**
 * Setzt die Logger-Instanz zurück (hauptsächlich für Tests)
 */
export function resetLogger(): void {
  logger = undefined as any;
}

// Re-export wichtiger Typen
export { LogLevel, LogFormat } from './LoggingService';
export type { ILoggingService } from './ILoggingService';
