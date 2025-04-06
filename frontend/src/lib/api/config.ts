/**
 * API-Konfiguration und Hilfsfunktionen
 * Definiert die grundlegenden Funktionen für API-Anfragen
 */
import { getAccessToken, refreshAccessToken } from '@/lib/auth';

// API-Basis-URL aus der Umgebung oder Standard-URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Standard-Request-Optionen
export const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Benutzerdefinierte Fehlerklasse für API-Anfragen
export class ApiRequestError extends Error {
  statusCode: number;
  errors: string[];
  
  constructor(message: string, statusCode = 500, errors: string[] = []) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Führt eine API-Anfrage durch
 * 
 * @param endpoint - API-Endpunkt (ohne Basis-URL)
 * @param options - Anfrage-Optionen
 * @returns Antwort als JSON
 * @throws ApiRequestError bei Fehlern
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Token aus dem Speicher holen
  const token = getAccessToken();
  
  // Optionen mit Authentifizierung vorbereiten
  const fetchOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // JSON-Antwort parsen
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Für Nicht-JSON-Antworten
      const text = await response.text();
      data = { message: text };
    }
    
    // Fehler behandeln
    if (!response.ok) {
      const errorMessage = data.message || data.error || 'Unbekannter Fehler';
      const errorDetails = data.errors || [];
      
      throw new ApiRequestError(
        errorMessage,
        response.status,
        errorDetails
      );
    }
    
    // Standard-Antwortstruktur
    return {
      success: true,
      message: data.message || 'Anfrage erfolgreich',
      data: data.data || data,
    };
  } catch (error) {
    // Fehler behandeln
    if (error instanceof ApiRequestError) {
      throw error;
    }
    
    // Netzwerkfehler oder andere Fehler
    throw new ApiRequestError(
      error instanceof Error ? error.message : 'Unbekannter Fehler',
      0,
      []
    );
  }
}

/**
 * API-Antwortstruktur
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * GET-Anfrage
 */
export function get<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST-Anfrage
 */
export function post<T = any>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT-Anfrage
 */
export function put<T = any>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE-Anfrage
 */
export function del<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * PATCH-Anfrage
 */
export function patch<T = any>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export default {
  get,
  post,
  put,
  delete: del,
  patch,
};
