import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/core/auth';
import { withErrorHandling } from '@/lib/server/core/globalErrorHandler';
import { container } from '@/lib/server/di-container';
import { ILoggingService } from '@/lib/server/interfaces/ILoggingService';
import { handleFileDownload } from '@/lib/server/core/fileStorage';
import { TokenPayload } from '@/lib/server/core/auth';
import path from 'path';

/**
 * GET /api/files/download
 * Lädt eine Datei herunter
 * 
 * Query Parameter:
 * - path: Relativer Pfad zur Datei (z.B. /uploads/documents/file.pdf)
 * - inline: (optional) Ob die Datei inline angezeigt werden soll (true/false)
 */
async function downloadFileHandler(req: NextRequest, user: TokenPayload) {
  const logger = container.resolve<ILoggingService>('LoggingService');
  
  try {
    // Extrahiere den Dateipfad aus den Query-Parametern
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    const inline = searchParams.get('inline') === 'true';
    
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Kein Dateipfad angegeben' },
        { status: 400 }
      );
    }
    
    // Pfad normalisieren und validieren
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    
    // Prüfen, ob der Pfad im uploads-Verzeichnis liegt
    if (!normalizedPath.startsWith('uploads/')) {
      logger.warn('Versuchter Zugriff auf nicht erlaubten Pfad', {
        userId: user.id,
        requestedPath: filePath,
        normalizedPath
      });
      
      return NextResponse.json(
        { success: false, error: 'Zugriff verweigert' },
        { status: 403 }
      );
    }
    
    // Protokolliere Download-Anfrage
    logger.info(`Datei-Download von Benutzer ${user.id}`, {
      userId: user.id,
      filePath: normalizedPath
    });
    
    // Datei zum Download bereitstellen
    return handleFileDownload(req, normalizedPath, {
      inline,
      addContentDisposition: true
    }, logger);
  } catch (error) {
    logger.error('Fehler beim Datei-Download', 
                error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Fehler beim Herunterladen der Datei' },
      { status: 500 }
    );
  }
}

// Export mit withAuth und withErrorHandling
export const GET = withErrorHandling(
  withAuth(downloadFileHandler),
  container.resolve<ILoggingService>('LoggingService')
);
