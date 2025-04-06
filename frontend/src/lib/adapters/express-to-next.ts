/**
 * Express zu NextJS Adapter
 * 
 * Diese Datei bietet Adapter-Funktionen, um Express-Controller und Middleware
 * in NextJS API-Routen zu verwenden. Dadurch können wir die bestehende Codebase
 * mit minimalen Änderungen wiederverwenden.
 */
import { NextRequest, NextResponse } from 'next/server';
import { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import { getLoggingService } from '../services/factory';

/**
 * Mock eines Express-Request-Objekts basierend auf NextRequest
 */
function createExpressRequest(req: NextRequest): any {
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  const cookies = Object.fromEntries(
    req.cookies.getAll().map(cookie => [cookie.name, cookie.value])
  );
  const headers = Object.fromEntries(req.headers.entries());
  
  let body = {};
  try {
    // Body bereits geparst, wenn vorhanden
    if (req.body) {
      const bodyText = req.body.toString();
      if (bodyText) {
        body = JSON.parse(bodyText);
      }
    }
  } catch (error) {
    // Ignorieren - Body wird dann leer bleiben
  }
  
  // Benutzerinformationen aus Header extrahieren
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');
  
  return {
    // Standard Express-Request-Eigenschaften
    params: {},
    query: searchParams,
    body,
    cookies,
    headers,
    method: req.method,
    url: req.url,
    path: url.pathname,
    protocol: url.protocol.replace(':', ''),
    hostname: url.hostname,
    
    // Auth-bezogene Eigenschaften
    user: userId ? { id: userId, role: userRole } : undefined,
    
    // Express-ähnliche Methoden
    get: (name: string) => headers[name.toLowerCase()],
    
    // Original NextRequest für erweiterten Zugriff
    originalRequest: req
  };
}

/**
 * Mock eines Express-Response-Objekts mit NextResponse-Konvertierung
 */
function createExpressResponse(onComplete: (result: NextResponse) => void): any {
  let statusCode = 200;
  let responseBody: any = null;
  let responseHeaders: Record<string, string> = {};
  let responseCookies: Array<{name: string, value: string, options: any}> = [];
  
  const res = {
    // Status-Manipulation
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    
    // Antwortmethoden
    send: (body: any) => {
      responseBody = body;
      const nextResponse = createNextResponse();
      onComplete(nextResponse);
      return res;
    },
    
    json: (body: any) => {
      responseBody = body;
      const nextResponse = createNextResponse();
      onComplete(nextResponse);
      return res;
    },
    
    // Header-Manipulation
    setHeader: (name: string, value: string) => {
      responseHeaders[name] = value;
      return res;
    },
    
    // Cookie-Manipulation
    cookie: (name: string, value: string, options: any = {}) => {
      responseCookies.push({ name, value, options });
      return res;
    },
    
    // Weiterleitungsmethode
    redirect: (url: string) => {
      const nextResponse = NextResponse.redirect(url);
      onComplete(nextResponse);
      return res;
    }
  };
  
  function createNextResponse(): NextResponse {
    // Antwort erstellen
    const response = NextResponse.json(responseBody, { status: statusCode });
    
    // Header setzen
    Object.entries(responseHeaders).forEach(([name, value]) => {
      response.headers.set(name, value);
    });
    
    // Cookies setzen
    responseCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    
    return response;
  }
  
  return res;
}

/**
 * Adapterfunktion für Express-Controller-Methoden
 * 
 * Diese Funktion nimmt eine Express-Controller-Methode und gibt eine NextJS-API-Handler-Funktion zurück.
 * 
 * @param controllerMethod Express-Controller-Methode (req, res) => void
 * @returns NextJS-API-Handler (req) => Promise<NextResponse>
 */
export function adaptController(controllerMethod: (req: any, res: any) => void | Promise<void>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const logger = getLoggingService();
    
    return new Promise((resolve) => {
      const expressReq = createExpressRequest(req);
      const expressRes = createExpressResponse(resolve);
      
      try {
        // Controller-Methode ausführen
        const result = controllerMethod(expressReq, expressRes);
        
        // Falls Promise, warten
        if (result instanceof Promise) {
          result.catch((error) => {
            logger.error(`Fehler in Controller-Methode: ${error.message}`, {
              stack: error.stack,
              path: expressReq.path
            });
            
            // Standardfehlerbehebung
            const errorResponse = NextResponse.json(
              { success: false, error: 'Interner Serverfehler' },
              { status: 500 }
            );
            resolve(errorResponse);
          });
        }
      } catch (error: any) {
        logger.error(`Fehler in Controller-Methode: ${error.message}`, {
          stack: error.stack,
          path: expressReq.path
        });
        
        // Standardfehlerbehebung
        const errorResponse = NextResponse.json(
          { success: false, error: 'Interner Serverfehler' },
          { status: 500 }
        );
        resolve(errorResponse);
      }
    });
  };
}

/**
 * Adapterfunktion für Express-Middleware
 * 
 * Diese Funktion nimmt eine Express-Middleware und gibt eine Funktion zurück,
 * die innerhalb von NextJS-API-Handlern verwendet werden kann.
 * 
 * @param middleware Express-Middleware (req, res, next) => void
 * @returns Adapterfunktion (req, res) => Promise<boolean>
 */
export function adaptMiddleware(middleware: (req: any, res: any, next: Function) => void) {
  return (req: any, res: any): Promise<boolean> => {
    return new Promise((resolve) => {
      middleware(req, res, () => resolve(true));
    });
  };
}