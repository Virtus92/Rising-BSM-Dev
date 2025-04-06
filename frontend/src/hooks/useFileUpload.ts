'use client';

import { useState, useCallback } from 'react';
import { uploadFile } from '@/lib/api/apiClient';
import { toast } from 'sonner';

export type FileUploadType = 'profilePictures' | 'documents' | 'general';

interface UploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  error?: string;
}

interface UseFileUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  showToasts?: boolean;
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // mime types
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
  
  const {
    onSuccess,
    onError,
    showToasts = true,
    maxSize,
    allowedTypes
  } = options;
  
  /**
   * Validiert eine Datei vor dem Upload
   */
  const validateFile = useCallback((file: File): boolean => {
    // Prüfen der Dateigröße
    if (maxSize && file.size > maxSize) {
      const errorMsg = `Die Datei ist zu groß. Maximum: ${(maxSize / (1024 * 1024)).toFixed(2)} MB`;
      setError(errorMsg);
      if (showToasts) toast.error(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return false;
    }
    
    // Prüfen des Dateityps
    if (allowedTypes && allowedTypes.length > 0) {
      if (!allowedTypes.includes(file.type)) {
        const errorMsg = `Ungültiger Dateityp. Erlaubte Typen: ${allowedTypes.join(', ')}`;
        setError(errorMsg);
        if (showToasts) toast.error(errorMsg);
        if (onError) onError(new Error(errorMsg));
        return false;
      }
    }
    
    return true;
  }, [maxSize, allowedTypes, showToasts, onError]);
  
  /**
   * Lädt eine Datei hoch
   */
  const upload = useCallback(async (
    file: File, 
    type: FileUploadType,
    additionalFields?: Record<string, string>
  ) => {
    if (!validateFile(file)) return null;
    
    setIsUploading(true);
    setError(null);
    setProgress(0);
    setUploadedFile(null);
    
    try {
      if (showToasts) {
        toast.loading(`Lade ${file.name} hoch...`);
      }
      
      // Simuliere Progress (nicht echt, da fetch keine Progress-Ereignisse hat)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 20;
          return next > 90 ? 90 : next;
        });
      }, 500);
      
      // Führe den Upload aus
      const result = await uploadFile(
        '/api/files/upload',
        file,
        { 
          type,
          ...additionalFields
        }
      );
      
      clearInterval(progressInterval);
      
      if (result.success && result.data) {
        setProgress(100);
        setUploadedFile(result.data as UploadResult);
        
        if (showToasts) {
          toast.success(`${file.name} erfolgreich hochgeladen`);
        }
        
        if (onSuccess) {
          onSuccess(result.data as UploadResult);
        }
        
        return result.data;
      } else {
        throw new Error(result.error || 'Unbekannter Fehler beim Upload');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler beim Upload';
      setError(errorMsg);
      
      if (showToasts) {
        toast.error(`Upload fehlgeschlagen: ${errorMsg}`);
      }
      
      if (onError && err instanceof Error) {
        onError(err);
      }
      
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, showToasts, onSuccess, onError]);
  
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
    isUploading,
    progress,
    error,
    uploadedFile,
    reset
  };
}

export default useFileUpload;
