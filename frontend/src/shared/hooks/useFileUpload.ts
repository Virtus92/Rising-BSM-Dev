'use client';

import { useState, useCallback } from 'react';
import { ApiClient } from '@/infrastructure/clients/ApiClient';
import { useToast } from '@/shared/hooks/useToast';

export type FileUploadType = 'profilePictures' | 'documents' | 'general' | 'customerFiles' | 'projectFiles';

interface UploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
  error?: string;
}

interface UseFileUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  showToasts?: boolean;
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // mime types, z.B. 'image/jpeg', 'application/pdf'
  uploadUrl?: string; // Custom upload URL
}

/**
 * Custom Hook für Datei-Uploads
 * 
 * @example
 * const { 
 *   upload, 
 *   isUploading, 
 *   progress, 
 *   error, 
 *   uploadedFile 
 * } = useFileUpload({
 *   onSuccess: (file) => console.log('Uploaded:', file),
 *   showToasts: true
 * });
 * 
 * // Verwendung in einem Input-Field:
 * <input 
 *   type="file" 
 *   onChange={(e) => {
 *     if (e.target.files?.length) {
 *       upload(e.target.files[0], 'documents');
 *     }
 *   }} 
 * />
 */
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);
  const { toast } = useToast();
  
  const {
    onSuccess,
    onError,
    showToasts = true,
    maxSize = 10 * 1024 * 1024, // Standard: 10 MB
    allowedTypes,
    uploadUrl = '/api/files/upload'
  } = options;
  
  /**
   * Validiert eine Datei vor dem Upload
   */
  const validateFile = useCallback((file: File): boolean => {
    // Prüfen der Dateigröße
    if (maxSize && file.size > maxSize) {
      const errorMsg = `Die Datei ist zu groß. Maximum: ${(maxSize / (1024 * 1024)).toFixed(2)} MB`;
      setError(errorMsg);
      
      if (showToasts) {
        toast({ 
          title: 'Upload-Fehler', 
          description: errorMsg,
          variant: 'error'
        });
      }
      
      if (onError) onError(new Error(errorMsg));
      return false;
    }
    
    // Prüfen des Dateityps
    if (allowedTypes && allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileType = file.type;
      
      // Prüfen nach MIME-Typ oder Dateiendung
      const isTypeAllowed = allowedTypes.some(type => {
        // Wenn der Typ ein MIME-Typ ist (enthält '/')
        if (type.includes('/')) {
          return fileType === type || 
            // Unterstütze Wildcards wie 'image/*'
            (type.endsWith('/*') && fileType.startsWith(type.split('/*')[0]));
        }
        // Wenn der Typ eine Dateiendung ist (beginnt mit '.')
        else if (type.startsWith('.')) {
          return fileExtension === type.substring(1);
        }
        // Wenn der Typ eine einfache Dateiendung ohne Punkt ist
        else {
          return fileExtension === type;
        }
      });
      
      if (!isTypeAllowed) {
        let typesList: string;
        if (allowedTypes.every(t => t.includes('/'))) {
          // Wenn alle Typen MIME-Typen sind, zeige eine benutzerfreundliche Beschreibung
          const typeMap: Record<string, string> = {
            'image/': 'Bilder',
            'application/pdf': 'PDF-Dokumente',
            'text/': 'Textdateien',
            'application/vnd.openxmlformats-officedocument': 'Office-Dokumente',
            'application/vnd.ms-': 'Office-Dokumente',
            'application/msword': 'Word-Dokumente',
            'application/vnd.openxmlformats-officedocument.wordprocessingml': 'Word-Dokumente',
            'application/vnd.openxmlformats-officedocument.spreadsheetml': 'Excel-Tabellen',
            'video/': 'Videos',
            'audio/': 'Audiodateien'
          };
          
          // Mappe MIME-Typen auf benutzerfreundliche Beschreibungen
          const mappedTypes = allowedTypes.map(type => {
            for (const [prefix, description] of Object.entries(typeMap)) {
              if (type.startsWith(prefix)) return description;
            }
            return type;
          });
          
          // Entferne Duplikate
          typesList = [...new Set(mappedTypes)].join(', ');
        } else {
          // Wenn es Dateiendungen sind, zeige diese direkt an
          typesList = allowedTypes.map(t => t.startsWith('.') ? t : `.${t}`).join(', ');
        }
        
        const errorMsg = `Ungültiger Dateityp. Erlaubte Typen: ${typesList}`;
        setError(errorMsg);
        
        if (showToasts) {
          toast({ 
            title: 'Upload-Fehler', 
            description: errorMsg,
            variant: 'error'
          });
        }
        
        if (onError) onError(new Error(errorMsg));
        return false;
      }
    }
    
    return true;
  }, [maxSize, allowedTypes, showToasts, onError, toast]);
  
  /**
   * Lädt eine Datei hoch
   */
  const upload = useCallback(async (
    file: File, 
    type: FileUploadType,
    additionalFields?: Record<string, string>
  ): Promise<UploadResult | null> => {
    if (!validateFile(file)) return null;
    
    setIsUploading(true);
    setError(null);
    setProgress(0);
    setUploadedFile(null);
    
    const uploadId = Math.random().toString(36).substring(2, 9);
    
    try {
      if (showToasts) {
        toast({ 
          title: 'Datei wird hochgeladen', 
          description: file.name,
          id: uploadId,
          variant: 'info'
        });
      }
      
      // Simuliere Progress (nicht echt, da fetch keine Progress-Ereignisse hat)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 20;
          return next > 90 ? 90 : next;
        });
      }, 500);
      
      // Führe den Upload aus
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      // Füge zusätzliche Felder hinzu
      if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        // Keine spezifischen Headers, da Content-Type vom Browser für FormData gesetzt wird
      });
      
      clearInterval(progressInterval);
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setProgress(100);
        const uploadResult = result.data as UploadResult;
        setUploadedFile(uploadResult);
        
        if (showToasts) {
          toast({ 
            title: 'Upload erfolgreich', 
            description: file.name,
            id: uploadId,
            variant: 'success'
          });
        }
        
        if (onSuccess) {
          onSuccess(uploadResult);
        }
        
        return uploadResult;
      } else {
        throw new Error((result as any).message || 'Unbekannter Fehler beim Upload');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler beim Upload';
      setError(errorMsg);
      
      if (showToasts) {
        toast({ 
          title: 'Upload fehlgeschlagen', 
          description: errorMsg,
          id: uploadId,
          variant: 'error'
        });
      }
      
      if (onError && err instanceof Error) {
        onError(err);
      }
      
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, showToasts, onSuccess, onError, toast, uploadUrl]);
  
  /**
   * Lädt mehrere Dateien nacheinander hoch
   */
  const uploadMultiple = useCallback(async (
    files: File[],
    type: FileUploadType,
    additionalFields?: Record<string, string>
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await upload(file, type, additionalFields);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }, [upload]);
  
  /**
   * Setzt den Upload-Status zurück
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setUploadedFile(null);
  }, []);
  
  return {
    upload,
    uploadMultiple,
    isUploading,
    progress,
    error,
    uploadedFile,
    reset
  };
}

export default useFileUpload;
