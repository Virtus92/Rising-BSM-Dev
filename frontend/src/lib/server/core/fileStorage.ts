import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ILoggingService } from '../interfaces/ILoggingService';
import { config } from '../config/env';

// Typen für Upload-Konfiguration
export interface UploadConfig {
  directory: string;
  maxSize: number; // in Bytes
  allowedTypes: string[];
  generateUniqueFilename?: boolean;
}

// Standardkonfigurationen für verschiedene Upload-Typen
export const uploadConfigs: Record<string, UploadConfig> = {
  profilePictures: {
    directory: 'profiles',
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: config.upload.allowedTypes.images,
    generateUniqueFilename: true
  },
  documents: {
    directory: 'documents',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: config.upload.allowedTypes.documents,
    generateUniqueFilename: true
  },
  general: {
    directory: 'general',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: config.upload.allowedTypes.all,
    generateUniqueFilename: true
  }
};

// Antwortschnittstelle für Upload-Handler
export interface UploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  error?: string;
}

/**
 * Stellt sicher, dass alle Upload-Verzeichnisse existieren
 */
export function initializeUploadDirectories(logger?: ILoggingService): void {
  try {
    // Basis-Upload-Verzeichnis
    const baseUploadDir = path.join(process.cwd(), 'public', config.upload.directory);
    if (!fs.existsSync(baseUploadDir)) {
      fs.mkdirSync(baseUploadDir, { recursive: true });
      logger?.info(`Basis-Upload-Verzeichnis erstellt: ${baseUploadDir}`);
    }
    
    // Unterverzeichnisse für die einzelnen Konfigurationen
    Object.values(uploadConfigs).forEach(configItem => {
      const fullPath = path.join(process.cwd(), 'public', config.upload.directory, configItem.directory);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        logger?.info(`Upload-Unterverzeichnis erstellt: ${fullPath}`);
      }
    });
  } catch (error) {
    logger?.error('Fehler beim Initialisieren der Upload-Verzeichnisse', 
                 error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Generiert einen sicheren, eindeutigen Dateinamen
 */
export function generateSecureFilename(originalFilename: string): string {
  const fileExtension = path.extname(originalFilename);
  const randomName = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${randomName}-${timestamp}${fileExtension}`;
}

/**
 * Validiert eine Datei basierend auf der Konfiguration
 */
export function validateFile(
  file: File, 
  config: UploadConfig
): { valid: boolean; error?: string } {
  // Validiere Dateityp
  if (!config.allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Nicht unterstützter Dateityp. Erlaubte Typen: ${config.allowedTypes.join(', ')}` 
    };
  }
  
  // Validiere Dateigröße
  if (file.size > config.maxSize) {
    return { 
      valid: false, 
      error: `Datei ist zu groß. Maximale Größe: ${Math.round(config.maxSize / 1024 / 1024)} MB` 
    };
  }
  
  return { valid: true };
}

/**
 * Verarbeitet eine Datei-Upload-Anfrage
 */
export async function handleFileUpload(
  req: NextRequest, 
  configKey: keyof typeof uploadConfigs,
  logger?: ILoggingService
): Promise<UploadResult> {
  const uploadConfig = uploadConfigs[configKey];
  if (!uploadConfig) {
    return { 
      success: false, 
      error: `Ungültige Upload-Konfiguration: ${configKey}` 
    };
  }
  
  try {
    // Formular-Daten extrahieren
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return { success: false, error: 'Keine Datei gefunden' };
    }
    
    logger?.debug('Datei-Upload verarbeiten', {
      originalFilename: file.name,
      size: file.size,
      type: file.type,
      configKey
    });
    
    // Datei validieren
    const validation = validateFile(file, uploadConfig);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Sicheren Dateinamen generieren
    const fileName = uploadConfig.generateUniqueFilename
      ? generateSecureFilename(file.name)
      : file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Unsichere Zeichen ersetzen
    
    // Relativer Pfad innerhalb des Uploads-Verzeichnisses
    const relativeDir = path.join(config.upload.directory, uploadConfig.directory);
    const relativePath = path.join(relativeDir, fileName);
    
    // Vollständiger Pfad zum Speichern
    const fullPath = path.join(process.cwd(), 'public', relativePath);
    
    // Datei als Array-Buffer lesen und speichern
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(fullPath, buffer);
    
    logger?.info('Datei erfolgreich hochgeladen', {
      originalFilename: file.name,
      storedFilename: fileName,
      path: relativePath,
      size: file.size,
      type: file.type
    });
    
    return { 
      success: true, 
      filePath: `/${relativePath.replace(/\\/g, '/')}`, // Backslashes für Web-Pfade durch Forward-Slashes ersetzen
      fileName,
      mimeType: file.type,
      size: file.size
    };
  } catch (error) {
    logger?.error('Fehler beim Hochladen der Datei', 
                 error instanceof Error ? error : new Error(String(error)));
    
    return { 
      success: false, 
      error: 'Fehler beim Hochladen der Datei: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

/**
 * Stellt eine Datei zum Download bereit mit Sicherheitsprüfungen
 */
export async function handleFileDownload(
  req: NextRequest,
  filePath: string,
  options: {
    fileName?: string; // Optionaler Download-Dateiname
    inline?: boolean; // Anzeigen statt Herunterladen
    addContentDisposition?: boolean; // Content-Disposition-Header hinzufügen
  } = {},
  logger?: ILoggingService
): Promise<NextResponse> {
  try {
    // Pfad normalisieren und Sicherheitsüberprüfung durchführen
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    
    // Sicherstellen, dass der Pfad im Upload-Verzeichnis bleibt
    if (!normalizedPath.startsWith(config.upload.directory)) {
      return NextResponse.json(
        { success: false, error: 'Zugriff verweigert' },
        { status: 403 }
      );
    }
    
    const fullPath = path.join(process.cwd(), 'public', normalizedPath);
    
    logger?.debug('Datei-Download angefordert', {
      requestPath: filePath,
      normalizedPath,
      fullPath
    });
    
    // Prüfen, ob Datei existiert
    if (!fs.existsSync(fullPath)) {
      logger?.warn('Datei für Download nicht gefunden', { fullPath });
      return NextResponse.json(
        { success: false, error: 'Datei nicht gefunden' },
        { status: 404 }
      );
    }
    
    // Datei-Eigenschaften abrufen
    const stat = fs.statSync(fullPath);
    
    // Datei-Inhalt lesen
    const fileBuffer = fs.readFileSync(fullPath);
    
    // MIME-Typ bestimmen
    const contentType = getContentTypeByExtension(fullPath) || 'application/octet-stream';
    
    // Response-Header
    const headers: HeadersInit = {
      'Content-Type': contentType,
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'max-age=3600'
    };
    
    // Content-Disposition-Header hinzufügen
    if (options.addContentDisposition !== false) {
      const disposition = options.inline ? 'inline' : 'attachment';
      const filename = options.fileName || path.basename(fullPath);
      headers['Content-Disposition'] = `${disposition}; filename="${encodeURIComponent(filename)}"`;
    }
    
    logger?.info('Datei-Download bereitgestellt', {
      path: normalizedPath,
      size: stat.size,
      contentType
    });
    
    // Stream als Antwort zurückgeben
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    logger?.error('Fehler beim Bereitstellen des Datei-Downloads', 
                 error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Fehler beim Herunterladen der Datei: ' + (error instanceof Error ? error.message : String(error))
      },
      { status: 500 }
    );
  }
}

/**
 * Bestimmt den MIME-Typ anhand der Dateiendung
 */
function getContentTypeByExtension(filePath: string): string | null {
  const extension = path.extname(filePath).toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip'
  };
  
  return mimeTypes[extension] || null;
}

/**
 * Löscht eine Datei sicher
 */
export async function deleteFile(
  filePath: string,
  logger?: ILoggingService
): Promise<boolean> {
  try {
    // Pfad normalisieren und Sicherheitsüberprüfung durchführen
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    
    // Sicherstellen, dass der Pfad im Upload-Verzeichnis bleibt
    if (!normalizedPath.startsWith(config.upload.directory)) {
      logger?.warn('Versuch, eine Datei außerhalb des Upload-Verzeichnisses zu löschen', { 
        requestedPath: filePath,
        normalizedPath 
      });
      return false;
    }
    
    const fullPath = path.join(process.cwd(), 'public', normalizedPath);
    
    // Prüfen, ob Datei existiert
    if (!fs.existsSync(fullPath)) {
      logger?.warn('Zu löschende Datei nicht gefunden', { fullPath });
      return false;
    }
    
    // Datei löschen
    fs.unlinkSync(fullPath);
    
    logger?.info('Datei erfolgreich gelöscht', { path: normalizedPath });
    return true;
  } catch (error) {
    logger?.error('Fehler beim Löschen der Datei', 
                 error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}
