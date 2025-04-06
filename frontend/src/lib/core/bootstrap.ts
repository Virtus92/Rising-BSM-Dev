/**
 * Bootstrap-Funktionen für NextJS
 * 
 * Diese Datei bietet die grundlegende Initialisierung der Anwendung für NextJS.
 */

import { PrismaClient } from '@prisma/client';
import { LoggingService } from './LoggingService';
import { LogLevel, LogFormat } from '../interfaces/ILoggingService';
import config from '../config';

// Singleton-Instanzen
let prismaInstance: PrismaClient | null = null;
let loggerInstance: LoggingService | null = null;
let initialized = false;

/**
 * Initialisiert die Anwendung
 * 
 * @returns true bei erfolgreicher Initialisierung
 */
export async function bootstrap(): Promise<boolean> {
  if (initialized) {
    return true;
  }
  
  try {
    // Logger initialisieren
    const logger = getLogger();
    logger.info('Anwendung wird initialisiert...');
    
    // Prisma initialisieren
    await getPrismaClient().$connect();
    logger.info('Prisma-Client erfolgreich initialisiert');
    
    // Als initialisiert markieren
    initialized = true;
    
    logger.info('Anwendung erfolgreich initialisiert');
    return true;
  } catch (error) {
    console.error('Fehler bei der Initialisierung:', error);
    return false;
  }
}

/**
 * Gibt den Logger zurück
 */
export function getLogger(): LoggingService {
  if (!loggerInstance) {
    loggerInstance = new LoggingService({
      level: (config.LOG_LEVEL as LogLevel) || LogLevel.INFO,
      format: process.env.NODE_ENV === 'production' ? LogFormat.JSON : LogFormat.PRETTY
    });
  }
  
  return loggerInstance;
}

/**
 * Gibt den Prisma-Client zurück
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }
  
  return prismaInstance;
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
    if (prismaInstance) {
      await prismaInstance.$disconnect();
      logger.info('Prisma-Client getrennt');
    }
    
    // Zurücksetzen
    prismaInstance = null;
    loggerInstance = null;
    initialized = false;
    
    logger.info('Anwendung erfolgreich heruntergefahren');
    return true;
  } catch (error) {
    console.error('Fehler beim Herunterfahren:', error);
    return false;
  }
}
