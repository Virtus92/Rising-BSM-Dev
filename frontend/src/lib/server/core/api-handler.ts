import { NextRequest, NextResponse } from 'next/server';
import { container, DIContainer } from '@/lib/server/di-container';
import { ILoggingService, LogLevel, LogFormat } from '@/lib/server/interfaces/ILoggingService';
import { LoggingService } from '@/lib/server/core/LoggingService';
import { TokenPayload } from './auth';

/**
 * Typ-Definition für einen API-Handler mit DI-Container Zugriff
 */
export type ApiHandler = (
  req: NextRequest, 
  user?: TokenPayload,
  services?: {
    logger: ILoggingService;
    [key: string]: any;
  }
) => Promise<NextResponse>;

/**
 * Wrapper für API-Handler, der den DI-Container korrekt verwaltet 
 * und Fehlerbehandlung sowie Logging konsistent implementiert
 */
export function createApiHandler(
  handler: ApiHandler,
  options: {
    servicesToResolve?: string[];
    requireAuth?: boolean;
  } = {}
) {
  const { servicesToResolve = [], requireAuth = false } = options;
  
  return async (req: NextRequest, user?: TokenPayload): Promise<NextResponse> => {
    // Fallback-Logger für den Fall, dass der Container nicht initialisiert ist
    let logger: ILoggingService;
    let requestId: string;
    let path: string;
    
    try {
      // Versuche den Logger aus dem Container zu bekommen
      try {
        logger = container.resolve<ILoggingService>('LoggingService');
      } catch (error) {
        // Fallback auf einen einfachen Logger, wenn DI-Container nicht verfügbar
        logger = new LoggingService({
          level: LogLevel.ERROR,
          format: LogFormat.PRETTY
        });
        logger.error('Fehler beim Auflösen des LoggingService - Fallback verwendet', error);
      }
      
      // Request-ID für Korrelation generieren
      requestId = req.headers.get('x-request-id') || crypto.randomUUID();
      path = req.nextUrl.pathname;
      
      // Logger mit Kontext für diesen Request erweitern
      const contextLogger = logger.withContext({ 
        requestId, 
        endpoint: path,
        method: req.method,
        ...(user ? { userId: user.id, userRole: user.role } : {})
      });
      
      contextLogger.debug(`Eingehende ${req.method}-Anfrage`, {
        headers: Object.fromEntries(req.headers),
        query: Object.fromEntries(req.nextUrl.searchParams)
      });
      
      // Services auflösen mit Fehlerbehandlung für jede Auflösung
      const services: { [key: string]: any } = {
        logger: contextLogger
      };
      
      // Zusätzliche Services aus dem Container auflösen
      for (const serviceName of servicesToResolve) {
        try {
          services[serviceName] = container.resolve(serviceName);
        } catch (error) {
          contextLogger.error(`Fehler beim Auflösen des Services: ${serviceName}`, error);
          throw new Error(`Service ${serviceName} konnte nicht aufgelöst werden: ${error.message}`);
        }
      }
      
      // Prüfen, ob Auth erforderlich ist und Benutzer fehlt
      if (requireAuth && !user) {
        throw new Error('Unauthorized: Benutzer nicht authentifiziert');
      }
      
      // API-Handler mit den aufgelösten Services und dem Benutzer aufrufen
      const response = await handler(req, user, services);
      
      // Erfolgreiche Anfrage loggen
      contextLogger.debug(`${req.method}-Anfrage erfolgreich verarbeitet`, {
        status: response.status,
      });
      
      return response;
    } catch (error: any) {
      // Fallback für logger und requestId, falls sie nicht definiert sind
      if (!logger) {
        logger = new LoggingService({
          level: LogLevel.ERROR,
          format: LogFormat.PRETTY
        });
      }
      
      if (!requestId) {
        requestId = crypto.randomUUID();
      }
      
      // Fehlermeldung und Statuscode bestimmen
      const errorMessage = error.message || 'Interner Serverfehler';
      const statusCode = error.statusCode || 500;
      
      // Fehler loggen
      logger.error(`Fehler bei der Verarbeitung der Anfrage`, error, {
        statusCode,
        errorMessage,
        path: path || req.nextUrl?.pathname || 'unknown',
        method: req.method,
        requestId
      });
      
      // Fehlerantwort zurückgeben
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          meta: {
            timestamp: new Date().toISOString(),
            requestId
          }
        },
        { status: statusCode }
      );
    }
  };
}

/**
 * Optimierte Version der withAuth-Funktion, die den createApiHandler verwendet
 */
export function withAuth(
  handler: ApiHandler,
  servicesToResolve: string[] = []
) {
  return (req: NextRequest, user?: TokenPayload): Promise<NextResponse> => {
    return createApiHandler(handler, {
      servicesToResolve,
      requireAuth: true
    })(req, user);
  };
}
