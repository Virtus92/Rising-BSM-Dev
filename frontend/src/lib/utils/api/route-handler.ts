/**
 * API Route Handler Utilities
 * 
 * Diese Datei stellt Hilfsfunktionen für die Implementierung von API-Routen bereit
 * und sorgt für konsistente Fehlerbehandlung und Authentifizierung.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiResponse } from './unified-response';
import { ValidationSchema } from '@/types/interfaces/IValidationService';
import { ValidationUtils } from '../validation-utils';
import { getLogger } from '@/lib/core/bootstrap';
import { getUserFromToken, getAccessToken } from '@/lib/auth';

/**
 * Options für API-Route-Handler
 */
export interface RouteHandlerOptions {
  /**
   * Optionales Validierungsschema für die Anfrage-Daten
   */
  schema?: ValidationSchema;
  
  /**
   * Ob Authentifizierung erforderlich ist
   */
  requireAuth?: boolean;
  
  /**
   * Erlaubte Benutzerrollen (wenn leer, sind alle Rollen erlaubt)
   */
  allowedRoles?: string[];
  
  /**
   * Ob detaillierte Fehler aktiviert sind
   */
  detailedErrors?: boolean;
}

/**
 * Standard-Handler für API-Routen
 * 
 * @param handler - Handler-Funktion für die Route
 * @param options - Optionen für den Route-Handler
 * @returns Next.js Route-Handler
 */
export function createRouteHandler<T = any>(
  handler: (req: NextRequest, context: any) => Promise<T>,
  options: RouteHandlerOptions = {}
) {
  return async function(req: NextRequest, context: any): Promise<NextResponse> {
    const logger = getLogger();
    
    try {
      // Optionale Authentifizierung
      if (options.requireAuth) {
        const token = getAccessToken();
        
        if (!token) {
          return apiResponse.unauthorized('Authentication required');
        }
        
        const user = getUserFromToken(token);
        
        if (!user) {
          return apiResponse.unauthorized('Invalid token');
        }
        
        // Rollenprüfung
        if (options.allowedRoles && options.allowedRoles.length > 0) {
          if (!options.allowedRoles.includes(user.role)) {
            return apiResponse.forbidden('Insufficient permissions');
          }
        }
        
        // Benutzer zum Kontext hinzufügen
        context = { ...context, user };
      }
      
      // Body-Validierung, falls notwendig
      if (options.schema && req.method !== 'GET' && req.method !== 'DELETE') {
        let body;
        
        // Body einlesen
        try {
          body = await req.json();
        } catch (error) {
          return apiResponse.validationError('Invalid request body', ['Request body must be valid JSON']);
        }
        
        // Body validieren
        const validation = ValidationUtils.validate(body, options.schema);
        
        if (!validation.isValid) {
          return apiResponse.validationError('Validation failed', validation.errors);
        }
        
        // Validierte Daten zum Kontext hinzufügen
        context = { ...context, body: validation.data };
      }
      
      // Request loggen
      logger.info(`${req.method} ${req.nextUrl.pathname}`, {
        method: req.method,
        path: req.nextUrl.pathname,
        query: Object.fromEntries(req.nextUrl.searchParams),
        userId: context?.user?.id
      });
      
      // Handler ausführen
      const result = await handler(req, context);
      
      // Erfolgsantwort zurückgeben
      if (result instanceof NextResponse) {
        return result;
      } else {
        return apiResponse.success(result);
      }
    } catch (error) {
      // Fehlerbehandlung
      logger.error(`Error handling ${req.method} ${req.nextUrl.pathname}`, error instanceof Error ? error : String(error));
      return apiResponse.handleError(error);
    }
  };
}

/**
 * Handler für GET-Anfragen
 */
export function createGetHandler<T = any>(
  handler: (req: NextRequest, context: any) => Promise<T>,
  options: RouteHandlerOptions = {}
) {
  return async function(req: NextRequest, context: any): Promise<NextResponse> {
    if (req.method !== 'GET') {
      return apiResponse.error(`Method ${req.method} Not Allowed`, 405);
    }
    
    const routeHandler = createRouteHandler(handler, options);
    return routeHandler(req, context);
  };
}

/**
 * Handler für POST-Anfragen
 */
export function createPostHandler<T = any>(
  handler: (req: NextRequest, context: any) => Promise<T>,
  options: RouteHandlerOptions = {}
) {
  return async function(req: NextRequest, context: any): Promise<NextResponse> {
    if (req.method !== 'POST') {
      return apiResponse.error(`Method ${req.method} Not Allowed`, 405);
    }
    
    const routeHandler = createRouteHandler(handler, options);
    return routeHandler(req, context);
  };
}

/**
 * Handler für PUT-Anfragen
 */
export function createPutHandler<T = any>(
  handler: (req: NextRequest, context: any) => Promise<T>,
  options: RouteHandlerOptions = {}
) {
  return async function(req: NextRequest, context: any): Promise<NextResponse> {
    if (req.method !== 'PUT') {
      return apiResponse.error(`Method ${req.method} Not Allowed`, 405);
    }
    
    const routeHandler = createRouteHandler(handler, options);
    return routeHandler(req, context);
  };
}

/**
 * Handler für DELETE-Anfragen
 */
export function createDeleteHandler<T = any>(
  handler: (req: NextRequest, context: any) => Promise<T>,
  options: RouteHandlerOptions = {}
) {
  return async function(req: NextRequest, context: any): Promise<NextResponse> {
    if (req.method !== 'DELETE') {
      return apiResponse.error(`Method ${req.method} Not Allowed`, 405);
    }
    
    const routeHandler = createRouteHandler(handler, options);
    return routeHandler(req, context);
  };
}

/**
 * Handler für PATCH-Anfragen
 */
export function createPatchHandler<T = any>(
  handler: (req: NextRequest, context: any) => Promise<T>,
  options: RouteHandlerOptions = {}
) {
  return async function(req: NextRequest, context: any): Promise<NextResponse> {
    if (req.method !== 'PATCH') {
      return apiResponse.error(`Method ${req.method} Not Allowed`, 405);
    }
    
    const routeHandler = createRouteHandler(handler, options);
    return routeHandler(req, context);
  };
}

/**
 * Handler, der mehrere HTTP-Methoden unterstützt
 */
export function createApiHandler(handlers: Record<string, any>, options: RouteHandlerOptions = {}) {
  return async function(req: NextRequest, context: any): Promise<NextResponse> {
    const method = req.method || 'GET';
    const handler = handlers[method];
    
    if (!handler) {
      return apiResponse.error(`Method ${method} Not Allowed`, 405);
    }
    
    const routeHandler = createRouteHandler(handler, options);
    return routeHandler(req, context);
  };
}
