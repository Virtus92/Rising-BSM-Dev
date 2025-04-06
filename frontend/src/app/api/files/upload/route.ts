import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/core/auth';
import { withErrorHandling } from '@/lib/server/core/globalErrorHandler';
import { container } from '@/lib/server/di-container';
import { ILoggingService } from '@/lib/server/interfaces/ILoggingService';
import { handleFileUpload, uploadConfigs } from '@/lib/server/core/fileStorage';
import { TokenPayload } from '@/lib/server/core/auth';

/**
 * POST /api/files/upload
 * Lädt eine Datei hoch und gibt den Pfad zurück
 */
async function uploadFileHandler(req: NextRequest, user: TokenPayload) {
  const logger = container.resolve<ILoggingService>('LoggingService');
  
  try {
    // Extrakt das Typ-Parameter aus FormData
    const formData = await req.formData();
    const fileType = formData.get('type') as string;
    
    if (!fileType || !Object.keys(uploadConfigs).includes(fileType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Ungültiger Dateityp. Erlaubte Typen: ${Object.keys(uploadConfigs).join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Re-Inject FormData zurück in Request (da wir es bereits extrahiert haben)
    const modifiedRequest = new NextRequest(req.url, {
      headers: req.headers,
      method: req.method,
      body: formData,
      credentials: 'include'
    });
    
    // Datei hochladen
    const result = await handleFileUpload(
      modifiedRequest, 
      fileType as keyof typeof uploadConfigs,
      logger
    );
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
    // Protokolliere Upload
    logger.info(`Datei hochgeladen von Benutzer ${user.id}`, {
      userId: user.id,
      filePath: result.filePath,
      fileName: result.fileName,
      fileType,
      size: result.size
    });
    
    return NextResponse.json(
      { 
        success: true, 
        data: {
          filePath: result.filePath,
          fileName: result.fileName,
          mimeType: result.mimeType,
          size: result.size
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Fehler beim Datei-Upload', 
                error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Fehler beim Hochladen der Datei' },
      { status: 500 }
    );
  }
}

// Export mit withAuth und withErrorHandling
export const POST = withErrorHandling(
  withAuth(uploadFileHandler),
  container.resolve<ILoggingService>('LoggingService')
);
