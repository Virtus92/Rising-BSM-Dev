/**
 * Client Error Logging API-Route
 * 
 * Diese Route ermöglicht das Protokollieren von Client-seitigen Fehlern
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * POST /api/log/client-error
 * 
 * Protokolliert einen Client-seitigen Fehler
 */
export const POST = apiRouteHandler(
  async (request: NextRequest) => {
    const logger = getLogger();
    const errorData = await request.json();
    
    // Extrahiere Fehlerinformationen
    const { 
      message, 
      stack, 
      url, 
      userAgent, 
      timestamp = new Date().toISOString(),
      componentStack,
      additionalInfo
    } = errorData;
    
    // Protokolliere den Fehler
    logger.error('Client Error', {
      message,
      stack,
      url,
      userAgent,
      timestamp,
      componentStack,
      additionalInfo,
      ip: request.headers.get('x-forwarded-for') || request.ip || 'unknown'
    });
    
    // Bestätige die Protokollierung
    return formatSuccess({ logged: true });
  },
  {
    // Keine Authentifizierung für Fehlerprotokolle erforderlich
    requiresAuth: false
  }
);