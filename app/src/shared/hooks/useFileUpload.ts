'use client';

import { useState, useCallback } from 'react';
import { ApiClient } from '@/core/api/ApiClient';
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
      
      // Simulate progress (since fetch doesn't have progress events)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 20;
          return next > 90 ? 90 : next;
        });
      }, 500);
      
      // Normalize the upload type for profile pictures
      let normalizedType = type;
      
      // Ensure consistent casing for profilePictures
      if (typeof normalizedType === 'string' && 
          (normalizedType.toLowerCase() === 'profilepictures' || 
           normalizedType.toLowerCase() === 'profilepicture')) {
        normalizedType = 'profilePictures'; // Consistent casing
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', normalizedType);
      
      // Add additional fields
      if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      
      // Add a retry mechanism for more reliability
      let attempts = 0;
      const maxAttempts = 3;
      let uploadResponse = null;
      let lastError = null;
      
      while (attempts < maxAttempts && !uploadResponse) {
        try {
          if (attempts > 0) {
            console.log(`Retrying file upload (attempt ${attempts + 1}/${maxAttempts})`);
            // Add delay for retries with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 500));
          }
          
          attempts++;
          
          // Execute the upload
          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            credentials: 'include', // Include cookies for authorization
            // No specific headers, Content-Type is set by browser for FormData
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
          }
          
          const result = await response.json();
          
          if (result.success && result.data) {
            uploadResponse = result;
            break;
          } else {
            throw new Error((result)?.message || 'Unknown error during upload');
          }
        } catch (error) {
          lastError = error;
          if (attempts >= maxAttempts) {
            throw error; // Re-throw on final attempt
          }
        }
      }
      
      clearInterval(progressInterval);
      
      if (uploadResponse && uploadResponse.success && uploadResponse.data) {
        setProgress(100);
        const uploadResult = uploadResponse.data as UploadResult;
        
        // Ensure consistent path format for profile pictures
        if (uploadResult.filePath && 
            typeof uploadResult.filePath === 'string' && 
            normalizedType === 'profilePictures') {
          // Fix inconsistent casing if needed
          if (uploadResult.filePath.toLowerCase().includes('/uploads/profilepictures/') &&
              !uploadResult.filePath.includes('/uploads/profilePictures/')) {
            uploadResult.filePath = uploadResult.filePath.replace(
              /\/uploads\/profilepictures\//i, 
              '/uploads/profilePictures/'
            );
            console.log('Normalized upload path:', uploadResult.filePath);
          }
        }
        
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
        throw new Error((lastError instanceof Error) ? lastError.message : 'Unknown error during upload');
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
      
      // Log detailed error information
      console.error('File upload error details:', {
        error: err,
        file: file.name,
        type: type
      });
      
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
