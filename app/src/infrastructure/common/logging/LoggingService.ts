import { ILoggingService, LogLevel, LogFormat, LoggingOptions } from './ILoggingService';

/**
 * LoggingService
 * 
 * Implementation von ILoggingService mit Logging-Funktionalität.
 * Kann an verschiedene Logging-Bibliotheken angepasst werden (Winston, Pino, etc.).
 */
export class LoggingService implements ILoggingService {
  private level: LogLevel;
  private format: LogFormat;
  private context: Record<string, any> = {};
  private timers: Map<string, number> = new Map();
  
  // Prioritäten für die Log-Level
  private readonly LOG_LEVEL_PRIORITIES: Record<LogLevel, number> = {
    [LogLevel.ERROR]: 3,
    [LogLevel.WARN]: 2,
    [LogLevel.INFO]: 1,
    [LogLevel.DEBUG]: 0
  };

  /**
   * Erstellt eine neue LoggingService-Instanz
   * 
   * @param options - Logging-Optionen
   */
  constructor(options?: LoggingOptions) {
    this.level = options?.level || LogLevel.INFO;
    this.format = options?.format || LogFormat.JSON;
    
    if (options?.labels) {
      this.context = { ...this.context, ...options.labels };
    }
    
    // Initialisiere transportspezifische Einstellungen
    this.initializeTransports(options);
  }

  /**
   * Protokolliert eine Info-Nachricht
   * 
   * @param message - Log-Nachricht
   * @param meta - Optionale Metadaten
   */
  public info(message: string, meta?: Record<string, any>): void {
    if (this.isLevelEnabled(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, meta);
    }
  }

  /**
   * Protokolliert eine Debug-Nachricht
   * 
   * @param message - Log-Nachricht
   * @param meta - Optionale Metadaten
   */
  public debug(message: string, meta?: Record<string, any>): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, meta);
    }
  }

  /**
   * Protokolliert eine Warn-Nachricht
   * 
   * @param message - Log-Nachricht
   * @param meta - Optionale Metadaten
   */
  public warn(message: string, meta?: Record<string, any>): void {
    if (this.isLevelEnabled(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, meta);
    }
  }

  /**
   * Protokolliert eine Fehlermeldung
   * 
   * @param message - Log-Nachricht
   * @param error - Fehler oder Metadaten
   * @param meta - Optionale Metadaten
   */
  public error(message: string, error?: Error | string | Record<string, any>, meta?: Record<string, any>): void {
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      // Behandle verschiedene Überladungen der Methode
      let errorData: any;
      let metaData: Record<string, any> | undefined;
      
      if (error instanceof Error) {
        // Fall 1: error ist ein Error-Objekt
        errorData = this.formatError(error);
        metaData = meta;
      } else if (typeof error === 'string') {
        // Fall 2: error ist ein String
        errorData = { message: error };
        metaData = meta;
      } else if (typeof error === 'object') {
        // Fall 3: error ist ein Objekt (Metadaten)
        errorData = undefined;
        metaData = error as Record<string, any>;
      } else {
        // Fall 4: error ist nicht definiert
        errorData = undefined;
        metaData = meta;
      }
      
      this.log(LogLevel.ERROR, message, { ...metaData, error: errorData });
    }
  }

  /**
   * Protokolliert eine HTTP-Anfrage
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   * @param responseTime - Antwortzeit in Millisekunden
   */
  public httpRequest(req: any, res: any, responseTime?: number): void {
    if (this.isLevelEnabled(LogLevel.INFO)) {
      const requestLog = {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime: responseTime ? `${responseTime}ms` : undefined,
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'],
        userId: req.user?.id
      };
      
      // Protokolliere auf angemessenem Level basierend auf Statuscode
      if (res.statusCode >= 500) {
        this.error(`Request failed: ${req.method} ${req.originalUrl}`, undefined, requestLog);
      } else if (res.statusCode >= 400) {
        this.warn(`Request error: ${req.method} ${req.originalUrl}`, requestLog);
      } else {
        this.info(`Request: ${req.method} ${req.originalUrl}`, requestLog);
      }
    }
  }

  /**
   * Erstellt einen Child-Logger mit zusätzlichem Kontext
   * 
   * @param context - Zusätzlicher Kontext
   */
  public child(context: Record<string, any>): ILoggingService {
    const childLogger = new LoggingService({
      level: this.level,
      format: this.format
    });
    
    // Kombiniere Eltern- und Kind-Kontext
    (childLogger as any).context = {
      ...this.context,
      ...context
    };
    
    return childLogger;
  }

  /**
   * Startet einen Timer
   * 
   * @param label - Timer-Label
   */
  public startTimer(label: string): string {
    this.timers.set(label, Date.now());
    return label;
  }

  /**
   * Beendet einen Timer und protokolliert die Dauer
   * 
   * @param timerId - Timer-ID
   * @param meta - Metadaten
   */
  public endTimer(timerId: string, meta?: Record<string, any>): void {
    const startTime = this.timers.get(timerId);
    
    if (startTime) {
      const duration = Date.now() - startTime;
      this.info(`Timer ${timerId} completed in ${duration}ms`, {
        ...meta,
        timerId,
        durationMs: duration
      });
      
      this.timers.delete(timerId);
    } else {
      this.warn(`Timer ${timerId} not found`, { timerId });
    }
  }

  /**
   * Prüft, ob ein Log-Level aktiviert ist
   * 
   * @param level - Zu prüfendes Log-Level
   */
  public isLevelEnabled(level: LogLevel): boolean {
    return this.LOG_LEVEL_PRIORITIES[level] >= this.LOG_LEVEL_PRIORITIES[this.level];
  }

  /**
   * Initialisiert die Logging-Transports
   * 
   * @param options - Logging-Optionen
   */
  private initializeTransports(options?: LoggingOptions): void {
    // Standardimplementierung richtet einfach die Konsole ein
    // In einer echten Implementierung würden hier Transports basierend auf Optionen konfiguriert
  }

  /**
   * Interne Logging-Methode
   * 
   * @param level - Log-Level
   * @param message - Nachricht
   * @param meta - Metadaten
   */
  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const correlationId = this.context.correlationId || 'none';
    
    const logData = {
      timestamp,
      level,
      message,
      correlationId,
      ...this.context,
      ...(meta || {})
    };
    
    // Ausgabe des Logs basierend auf Format
    switch (this.format) {
      case LogFormat.JSON:
        console.log(JSON.stringify(logData));
        break;
      
      case LogFormat.PRETTY:
        // Farbausgabe basierend auf Level
        const color = this.getColorForLevel(level);
        const reset = '\x1b[0m';
        
        // Formatiere Metadaten
        const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
        
        console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${reset}${metaStr}`);
        break;
      
      case LogFormat.TEXT:
      default:
        // Einfaches Textformat
        const metaText = meta ? ` ${JSON.stringify(meta)}` : '';
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${metaText}`);
        break;
    }
  }

  /**
   * Gibt den ANSI-Farbcode für ein Log-Level zurück
   * 
   * @param level - Log-Level
   */
  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return '\x1b[31m'; // Rot
      case LogLevel.WARN:
        return '\x1b[33m'; // Gelb
      case LogLevel.INFO:
        return '\x1b[36m'; // Cyan
      case LogLevel.DEBUG:
        return '\x1b[90m'; // Grau
      default:
        return '\x1b[0m'; // Reset
    }
  }

  /**
   * Formatiert einen Fehler für das Logging
   * 
   * @param error - Fehler
   */
  private formatError(error: Error): any {
    if (!error) {
      return undefined;
    }
    
    // Extrahiere nützliche Eigenschaften aus dem Error-Objekt
    const { name, message, stack, ...rest } = error;
    
    return {
      name,
      message,
      stack: this.isLevelEnabled(LogLevel.DEBUG) ? stack : undefined,
      ...rest
    };
  }
}

// Export der Enum-Typen für die Verwendung in bootstrap.ts
export { LogLevel, LogFormat };
