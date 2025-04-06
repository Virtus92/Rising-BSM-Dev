import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from './auth';
import { container } from '../di-container';
import { ILoggingService } from '../interfaces/ILoggingService';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiHandlerOptions {
  requireAuth?: boolean;
  roles?: string[];
  services?: string[];
  logRequest?: boolean;
}

/**
 * Standard-Antwortformat für API-Antworten
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * Erstellt eine standardisierte API-Antwort
 */
export function createApiResponse<T>(
  data?: T,
  success = true,
  error?: string,
  errors?: string[],
  meta?: Record<string, any>,
  status = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (error) {
    response.error = error;
  }

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return NextResponse.json(response, { status });
}

/**
 * Erstellt einen API-Handler mit standardisiertem Fehler-Handling und Authentifizierung
 */
export function createApiHandler(
  handlers: Partial<Record<HttpMethod, (req: NextRequest, params: any, user?: any, services?: any) => Promise<NextResponse>>>,
  options: ApiHandlerOptions = {}
) {
  const {
    requireAuth = true,
    roles = [],
    services = ['LoggingService'],
    logRequest = true
  } = options;

  // Wrapper-Funktion für Route-Handler
  const handleRequest = async (
    req: NextRequest,
    params: any = {},
    user?: any,
    injectedServices?: any
  ) => {
    const method = req.method as HttpMethod;
    const handler = handlers[method];

    if (!handler) {
      return createApiResponse(
        undefined,
        false,
        `Method ${method} not allowed`,
        undefined,
        undefined,
        405
      );
    }

    try {
      return await handler(req, params, user, injectedServices);
    } catch (error: any) {
      console.error(`Error in ${method} handler:`, error);

      const statusCode = error.statusCode || 500;
      const errorMessage = error.message || 'Ein unerwarteter Fehler ist aufgetreten';
      const errorDetails = error.errors || [];

      return createApiResponse(
        undefined,
        false,
        errorMessage,
        errorDetails.length > 0 ? errorDetails : undefined,
        { errorCode: error.code },
        statusCode
      );
    }
  };

  // Wenn keine Authentifizierung erforderlich ist, direkten Handler zurückgeben
  if (!requireAuth) {
    return async function (req: NextRequest, { params }: { params: any }) {
      // Logger beschaffen, wenn benötigt
      let injectedServices = {};
      
      if (logRequest) {
        try {
          const logger = container.resolve<ILoggingService>('LoggingService');
          logger.info(`API Request: ${req.method} ${req.url}`);
          injectedServices = { logger };
        } catch (error) {
          console.warn('Failed to resolve logger for API request');
        }
      }

      return handleRequest(req, params, undefined, injectedServices);
    };
  }

  // Mit Authentifizierung
  return withAuth(
    async (req: NextRequest, user, injectedServices) => {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const params: Record<string, string> = {};

      // Parameter aus Route extrahieren
      pathParts.forEach((part, index) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          const paramName = part.slice(1, -1);
          params[paramName] = pathParts[index + 1];
        }
      });

      if (logRequest && injectedServices.logger) {
        injectedServices.logger.info(`Authenticated API Request: ${req.method} ${req.url}`, {
          userId: user?.id,
          userName: user?.name
        });
      }

      // Rollen-Prüfung, falls erforderlich
      if (roles.length > 0 && user) {
        const hasRequiredRole = roles.includes(user.role);
        if (!hasRequiredRole) {
          return createApiResponse(
            undefined,
            false,
            'Unzureichende Berechtigungen für diese Aktion',
            undefined,
            undefined,
            403
          );
        }
      }

      return handleRequest(req, params, user, injectedServices);
    },
    services
  );
}
