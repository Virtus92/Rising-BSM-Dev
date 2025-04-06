import { 
  ILoggingService,
  LoggingConfig, 
  LogLevel, 
  LogFormat,
  LogOptions
} from '../interfaces/ILoggingService';

/**
 * Erweiterte Logging-Service-Implementierung mit Kontextunterstützung und Datenfilterung
 */
export class LoggingService implements ILoggingService {
  private config: LoggingConfig = {
    level: LogLevel.INFO,
    format: LogFormat.PRETTY,
    hideFields: ['password', 'secret', 'token', 'creditCard', 'authorization'],
    maskFields: ['email', 'phone', 'name', 'address'],
    service: 'rising-bsm',
    environment: process.env.NODE_ENV || 'development',
    colorize: process.env.NODE_ENV !== 'production'
  };
  
  // Speichert den Kontext für verschachtelte Logger
  private context: Record<string, any> = {};
  
  constructor(config?: Partial<LoggingConfig>, context?: Record<string, any>) {
    if (config) {
      this.configure(config);
    }
    
    if (context) {
      this.context = { ...context };
    }
  }
  
  /**
   * Konfiguriert den Logger
   */
  configure(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Debug-Log
   */
  debug(message: string, meta?: any, options?: LogOptions): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log('debug', message, meta, options);
    }
  }
  
  /**
   * Info-Log
   */
  info(message: string, meta?: any, options?: LogOptions): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log('info', message, meta, options);
    }
  }
  
  /**
   * HTTP-Log speziell für HTTP-Anfragen
   */
  http(message: string, meta?: any, options?: LogOptions): void {
    if (this.shouldLog(LogLevel.HTTP)) {
      this.log('http', message, meta, options);
    }
  }
  
  /**
   * Warn-Log
   */
  warn(message: string, meta?: any, options?: LogOptions): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log('warn', message, meta, options);
    }
  }
  
  /**
   * Error-Log
   */
  error(message: string, error?: Error, meta?: any, options?: LogOptions): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const combinedMeta = {
        ...(meta || {}),
        ...(error ? {
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
            ...this.extractAdditionalErrorInfo(error)
          }
        } : {})
      };
      
      this.log('error', message, combinedMeta, options);
    }
  }
  
  /**
   * Erstellt einen neuen Logger mit erweitertem Kontext
   */
  withContext(additionalContext: Record<string, any>): ILoggingService {
    return new LoggingService(
      this.config, 
      { ...this.context, ...additionalContext }
    );
  }
  
  /**
   * Prüft, ob ein bestimmtes Log-Level ausgegeben werden soll
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG, 
      LogLevel.HTTP, 
      LogLevel.INFO, 
      LogLevel.WARN, 
      LogLevel.ERROR
    ];
    
    const configLevelIndex = levels.indexOf(this.config.level);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= configLevelIndex;
  }
  
  /**
   * Führt das eigentliche Logging aus
   */
  private log(level: string, message: string, meta?: any, options?: LogOptions): void {
    const timestamp = new Date().toISOString();
    const correlationId = options?.correlationId || crypto.randomUUID();
    
    // Kontext und Metadaten zusammenführen
    const combinedMeta = {
      ...this.context,
      ...(meta || {}),
      ...(options?.component ? { component: options.component } : {}),
      ...(options?.userId ? { userId: options.userId } : {}),
      ...(options?.tags ? { tags: options.tags } : {})
    };
    
    // Sensible Daten filtern
    const filteredMeta = this.sanitizeData(
      combinedMeta, 
      [...(this.config.hideFields || [])],
      [...(this.config.maskFields || []), ...(options?.maskedFields || [])]
    );
    
    if (this.config.format === LogFormat.JSON) {
      const logObject = {
        timestamp,
        level,
        message,
        correlationId,
        service: this.config.service,
        environment: this.config.environment,
        ...filteredMeta
      };
      
      console.log(JSON.stringify(logObject));
    } else if (this.config.format === LogFormat.SIMPLE) {
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.config.service}] ${message}`;
      console.log(logMessage);
    } else {
      // PRETTY Format mit Farben und formatierter Ausgabe
      let levelFormatted = level.toUpperCase();
      
      if (this.config.colorize) {
        const colors = {
          debug: '\x1b[34m', // Blau
          http: '\x1b[36m',  // Cyan
          info: '\x1b[32m',  // Grün
          warn: '\x1b[33m',  // Gelb
          error: '\x1b[31m'  // Rot
        };
        
        const resetColor = '\x1b[0m';
        levelFormatted = `${colors[level as keyof typeof colors]}${level.toUpperCase()}${resetColor}`;
      }
      
      const contextStr = Object.keys(filteredMeta).length > 0 
        ? `\n${JSON.stringify(filteredMeta, null, 2)}`
        : '';
      
      (console[level as keyof Console] as Function)(
        `[${timestamp}] [${levelFormatted}] [${correlationId}] ${message}${contextStr}`
      );
    }
  }
  
  /**
   * Filtert sensible Daten aus den Logs
   */
  private sanitizeData(
    data: any, 
    hideFields: string[] = [], 
    maskFields: string[] = []
  ): any {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item, hideFields, maskFields));
    }
    
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Feld komplett ausblenden
      if (hideFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        result[key] = '[REDACTED]';
        continue;
      }
      
      // Feld maskieren
      if (maskFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        if (typeof value === 'string') {
          result[key] = this.maskString(value);
        } else {
          result[key] = '[MASKED]';
        }
        continue;
      }
      
      // Rekursiv für Objekte
      if (value && typeof value === 'object') {
        result[key] = this.sanitizeData(value, hideFields, maskFields);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Maskiert einen String (zeigt nur die ersten und letzten Zeichen)
   */
  private maskString(value: string): string {
    if (value.length <= 4) {
      return '*'.repeat(value.length);
    }
    
    const visibleLength = Math.min(Math.floor(value.length * 0.25), 2);
    return value.substring(0, visibleLength) + 
           '*'.repeat(value.length - (visibleLength * 2)) + 
           value.substring(value.length - visibleLength);
  }
  
  /**
   * Extrahiert zusätzliche Fehlerinformationen aus Error-Objekten
   */
  private extractAdditionalErrorInfo(error: Error): Record<string, any> {
    const additional: Record<string, any> = {};
    
    // Extrahiere alle nicht-standardmäßigen Error-Eigenschaften
    for (const key of Object.getOwnPropertyNames(error)) {
      if (!['name', 'message', 'stack'].includes(key)) {
        // @ts-ignore - Wir wissen nicht, welche Eigenschaften der Fehler hat
        additional[key] = error[key];
      }
    }
    
    return additional;
  }
}
