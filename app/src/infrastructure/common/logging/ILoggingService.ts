/**
 * Log-Level
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Log-Format
 */
export enum LogFormat {
  JSON = 'json',
  TEXT = 'text',
  PRETTY = 'pretty'
}

/**
 * Logging-Optionen
 */
export interface LoggingOptions {
  /**
   * Log-Level
   */
  level?: LogLevel;
  
  /**
   * Log-Format
   */
  format?: LogFormat;
  
  /**
   * Labels für alle Logs
   */
  labels?: Record<string, any>;
  
  /**
   * Zusätzliche Optionen
   */
  [key: string]: any;
}

/**
 * Interface für Logging-Services
 */
export interface ILoggingService {
  /**
   * Protokolliert eine informative Nachricht
   * 
   * @param message - Nachricht
   * @param meta - Metadaten
   */
  info(message: string, meta?: Record<string, any>): void;
  
  /**
   * Protokolliert eine Debug-Nachricht
   * 
   * @param message - Nachricht
   * @param meta - Metadaten
   */
  debug(message: string, meta?: Record<string, any>): void;
  
  /**
   * Protokolliert eine Warnung
   * 
   * @param message - Nachricht
   * @param meta - Metadaten
   */
  warn(message: string, meta?: Record<string, any>): void;
  
  /**
   * Protokolliert einen Fehler
   * 
   * @param message - Nachricht
   * @param error - Fehler
   * @param meta - Metadaten
   */
  error(message: string, error?: Error | string | Record<string, any>, meta?: Record<string, any>): void;
  
  /**
   * Protokolliert eine HTTP-Anfrage
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   * @param responseTime - Antwortzeit in Millisekunden
   */
  httpRequest(req: any, res: any, responseTime?: number): void;
  
  /**
   * Erstellt einen Child-Logger mit zusätzlichem Kontext
   * 
   * @param context - Zusätzlicher Kontext
   */
  child(context: Record<string, any>): ILoggingService;
  
  /**
   * Startet einen Timer
   * 
   * @param label - Timer-Label
   */
  startTimer(label: string): string;
  
  /**
   * Beendet einen Timer und protokolliert die Dauer
   * 
   * @param timerId - Timer-ID
   * @param meta - Metadaten
   */
  endTimer(timerId: string, meta?: Record<string, any>): void;
  
  /**
   * Prüft, ob ein Log-Level aktiviert ist
   * 
   * @param level - Zu prüfendes Log-Level
   */
  isLevelEnabled(level: LogLevel): boolean;
}
