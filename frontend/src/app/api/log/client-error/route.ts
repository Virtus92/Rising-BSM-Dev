import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/server/core/globalErrorHandler';
import { container } from '@/lib/server/di-container';
import { ILoggingService } from '@/lib/server/interfaces/ILoggingService';

/**
 * POST /api/log/client-error
 * Protokolliert Client-seitige Fehler
 */
async function handleClientError(req: NextRequest) {
  const logger = container.resolve<ILoggingService>('LoggingService');
  
  try {
    const errorData = await req.json();
    
    // Extrahiere relevante Informationen
    const {
      message,
      name,
      stack,
      componentStack,
      url,
      userAgent
    } = errorData;
    
    // Protokolliere den Fehler
    logger.error('Client-Fehler', new Error(message), {
      errorType: name,
      stack,
      componentStack,
      url,
      userAgent,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Fehler beim Protokollieren eines Client-Fehlers', 
                error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Fehler beim Protokollieren' },
      { status: 500 }
    );
  }
}

export const POST = withErrorHandling(handleClientError, container.resolve<ILoggingService>('LoggingService'));
