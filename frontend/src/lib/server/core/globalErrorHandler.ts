import { NextRequest, NextResponse } from 'next/server';
import { ILoggingService } from '../interfaces/ILoggingService';

/**
 * Globaler Fehlerhandler für API-Routen
 * Formatiert Fehler einheitlich und protokolliert sie mit dem Logger
 */
export function globalErrorHandler(
  error: Error,
  req: NextRequest,
  logger: ILoggingService
): NextResponse {
  // Fehler-Typ und Statuscode bestimmen
  let statusCode = 500;
  let errorMessage = 'Ein interner Serverfehler ist aufgetreten';
  let details: any = undefined;

  // Request-ID aus dem Header extrahieren oder eine neue generieren
  const requestId = req.headers.get('X-Request-ID') || crypto.randomUUID();

  // Spezifischere Fehlertypen hier behandeln
  if ('statusCode' in error && typeof (error as any).statusCode === 'number') {
    statusCode = (error as any).statusCode;
  }
  
  if ('details' in error) {
    details = (error as any).details;
  }

  // Im Entwicklungsmodus mehr Informationen zurückgeben
  if (process.env.NODE_ENV === 'development') {
    errorMessage = error.message;
  }

  // Detaillierte Fehlerinformationen protokollieren
  logger.error('Unhandled error', error, {
    path: req.nextUrl.pathname,
    method: req.method,
    query: Object.fromEntries(req.nextUrl.searchParams.entries()),
    ip: req.ip || req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
    statusCode,
    requestId
  });

  // Standardisierte API-Antwort
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      errors: details ? [details] : undefined,
      meta: {
        timestamp: new Date().toISOString(),
        requestId
      }
    },
    { 
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    }
  );
}

/**
 * Higher-Order-Funktion für einheitliche Fehlerbehandlung in API-Routen
 */
export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>,
  logger: ILoggingService
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      return globalErrorHandler(
        error instanceof Error ? error : new Error(String(error)),
        req, 
        logger
      );
    }
  };
}
