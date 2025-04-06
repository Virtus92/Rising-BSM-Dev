/**
 * Verfügbare Log-Level
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  HTTP = 'http'
}

/**
 * Log-Format-Optionen
 */
export enum LogFormat {
  PRETTY = 'pretty',
  JSON = 'json',
  SIMPLE = 'simple'
}

/**
 * Konfiguration für den Logging-Service
 */
export interface LoggingConfig {
  level: LogLevel;
  format: LogFormat;
  hideFields?: string[]; // Felder, die aus Logs ausgeblendet werden sollen
  maskFields?: string[]; // Felder, die maskiert werden sollen (z.B. Passwörter)
  service?: string; // Name des Services für bessere Identifikation
  environment?: string; // Umgebung (dev, prod, test)
  colorize?: boolean; // Farben für Terminal-Ausgabe
}

/**
 * Konfiguration für einen einzelnen Log-Eintrag
 */
export interface LogOptions {
  correlationId?: string; // Eindeutige ID für Request-Tracking
  userId?: string | number; // Benutzer-ID für Benutzeraktionen
  component?: string; // Komponente, die das Log erzeugt
  tags?: string[]; // Tags zur besseren Filterung
  maskedFields?: string[]; // Felder, die speziell für diesen Log maskiert werden sollen
}

/**
 * Interface für Logging-Service
 */
export interface ILoggingService {
  /**
   * Konfiguriert den Logger
   */
  configure(config: Partial<LoggingConfig>): void;
  
  /**
   * Debug-Log für detaillierte Entwicklungsinformationen
   */
  debug(message: string, meta?: any, options?: LogOptions): void;
  
  /**
   * Info-Log für allgemeine Informationen zum Systemablauf
   */
  info(message: string, meta?: any, options?: LogOptions): void;
  
  /**
   * HTTP-Log speziell für HTTP-Anfragen und Antworten
   */
  http(message: string, meta?: any, options?: LogOptions): void;
  
  /**
   * Warn-Log für unerwünschte Zustände, die aber nicht kritisch sind
   */
  warn(message: string, meta?: any, options?: LogOptions): void;
  
  /**
   * Error-Log für Fehler, die Aufmerksamkeit erfordern
   */
  error(message: string, error?: Error, meta?: any, options?: LogOptions): void;
  
  /**
   * Beginnt einen neuen Kontext für Logs
   */
  withContext(context: Record<string, any>): ILoggingService;
}
