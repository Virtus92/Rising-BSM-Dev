/**
 * Einheitlicher Bootstrap-Mechanismus für Rising-BSM
 * 
 * Diese Datei vereinheitlicht die vorherigen Bootstrap-Mechanismen und
 * bietet einen einzigen, klaren Initialisierungspunkt für die Next.js-Anwendung.
 */

import { PrismaClient } from '@prisma/client';
import { LoggingService } from './LoggingService';
import { LogLevel, LogFormat } from '@/types/interfaces/ILoggingService';
import { createLogger } from '@/lib/utils/logging/logger-service';
import { ErrorHandler } from '@/lib/utils/errors/error-handler';
import { ValidationService } from './ValidationService';
import { prisma } from '../db'; // Die zentrale Prisma-Instanz aus db.ts

// Initialisierungsstatus
let initialized = false;

// Singleton-Services
let loggerService: LoggingService;
let errorHandler: ErrorHandler;
let validationService: ValidationService;

/**
 * Initialisiert die Anwendung
 */
export async function bootstrap(): Promise<boolean> {
  if (initialized) {
    getLogger().debug('Bootstrap bereits initialisiert - wird übersprungen');
    return true;
  }
  
  try {
    // Logger initialisieren
    const logger = getLogger();
    logger.info('Rising-BSM wird initialisiert...');
    
    // Kernkomponenten initialisieren
    initializeCore();
    
    // Datenbankverbindung prüfen
    await prisma.$connect();
    logger.info('Datenbankverbindung bestätigt');
    
    // Als initialisiert markieren
    initialized = true;
    
    logger.info('Rising-BSM erfolgreich initialisiert');
    return true;
  } catch (error) {
    console.error('Fehler bei der Initialisierung:', error);
    return false;
  }
}

/**
 * Initialisiert die Kernkomponenten
 */
function initializeCore(): void {
  if (!loggerService) {
    loggerService = new LoggingService({
      level: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO,
      format: process.env.NODE_ENV === 'production' ? LogFormat.JSON : LogFormat.PRETTY
    });
  }
  
  if (!errorHandler) {
    errorHandler = new ErrorHandler(loggerService);
  }
  
  if (!validationService) {
    validationService = new ValidationService(loggerService, errorHandler);
  }
  
  loggerService.debug('Kernkomponenten initialisiert');
}

/**
 * Gibt den Logger zurück
 */
export function getLogger(): LoggingService {
  if (!loggerService) {
    loggerService = new LoggingService({
      level: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO,
      format: process.env.NODE_ENV === 'production' ? LogFormat.JSON : LogFormat.PRETTY
    });
  }
  
  return loggerService;
}

/**
 * Gibt den Error-Handler zurück
 */
export function getErrorHandler(): ErrorHandler {
  if (!errorHandler) {
    errorHandler = new ErrorHandler(getLogger());
  }
  
  return errorHandler;
}

/**
 * Gibt den Validierungs-Service zurück
 */
export function getValidationService(): ValidationService {
  if (!validationService) {
    validationService = new ValidationService(getLogger(), getErrorHandler());
  }
  
  return validationService;
}

/**
 * Fährt die Anwendung herunter
 */
export async function shutdown(): Promise<boolean> {
  if (!initialized) {
    return true;
  }
  
  try {
    const logger = getLogger();
    logger.info('Anwendung wird heruntergefahren...');
    
    // Prisma-Verbindung trennen
    await prisma.$disconnect();
    logger.info('Datenbankverbindung getrennt');
    
    // Zurücksetzen
    initialized = false;
    
    logger.info('Anwendung erfolgreich heruntergefahren');
    return true;
  } catch (error) {
    console.error('Fehler beim Herunterfahren:', error);
    return false;
  }
}
