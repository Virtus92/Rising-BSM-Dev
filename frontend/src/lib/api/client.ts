/**
 * Vereinheitlichter API-Client für die Frontend-Kommunikation mit dem Backend
 * Ersetzt die bestehenden Implementierungen in config.ts und apiClient.ts
 */
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../auth';

// API Basis-URL für lokale API-Routes
const API_BASE_URL = '/api';

// Standard-Fehlermeldungen
export const ERROR_MESSAGES = {
  NETWORK: 'Netzwerkfehler: Bitte überprüfen Sie Ihre Internetverbindung',
  SERVER: 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut',
  UNAUTHORIZED: 'Nicht autorisiert. Bitte melden Sie sich an',
  FORBIDDEN: 'Zugriff verweigert. Sie haben keine Berechtigung für diese Aktion',
  NOT_FOUND: 'Die angeforderte Ressource wurde nicht gefunden',
  VALIDATION: 'Die eingegebenen Daten sind ungültig',
  DEFAULT: 'Ein unerwarteter Fehler ist aufgetreten',
  SESSION_EXPIRED: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an',
  PARSE_ERROR: 'Fehler beim Verarbeiten der Serverantwort'
};

// Typen für API-Antworten
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
  meta?: {
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
    filters?: Record<string, any>;
  };
}

// Typisierte Error-Klasse für API-Fehler
export class ApiRequestError extends Error {
  statusCode: number;
  errors?: string[];
  
  constructor(message: string, statusCode: number = 500, errors?: string[]) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Bereitet Headers mit Auth-Token vor, falls erforderlich
 */
const prepareHeaders = (headers: HeadersInit = {}, requiresAuth: boolean): HeadersInit => {
  const baseHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers
  };
  
  if (!requiresAuth) {
    return baseHeaders;
  }
  
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    console.warn('Kein Auth-Token verfügbar für authentifizierte Anfrage');
    return baseHeaders;
  }
  
  return {
    ...baseHeaders,
    'Authorization': `Bearer ${accessToken}`
  };
};

/**
 * Verarbeitet API-Antworten und behandelt Fehler
 */
export async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const isBinary = contentType?.includes('application/vnd.openxmlformats-officedocument') || contentType?.includes('text/csv');
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      isJson,
      url: response.url
    });
  }
  
  if (!response.ok) {
    // Versuchen, Fehlerdetails aus der Antwort zu extrahieren
    if (isJson) {
      try {
        const errorData = await response.json() as ApiResponse<any>;
        
        throw new ApiRequestError(
          errorData.error || getDefaultErrorMessage(response.status),
          response.status,
          errorData.errors
        );
      } catch (error) {
        // Falls die JSON-Verarbeitung fehlschlägt, den ursprünglichen Fehler werfen
        if (error instanceof ApiRequestError) throw error;
        
        throw new ApiRequestError(
          getDefaultErrorMessage(response.status),
          response.status
        );
      }
    }
    
    // Wenn keine JSON-Antwort, generischen Fehler basierend auf Status werfen
    throw new ApiRequestError(
      getDefaultErrorMessage(response.status),
      response.status
    );
  }
  
  // Erfolgreiche Antwort verarbeiten
  if (isJson) {
    try {
      const jsonData = await response.json() as ApiResponse<T>;
      return jsonData;
    } catch (error) {
      console.error('JSON Parse Error:', error);
      throw new ApiRequestError(
        ERROR_MESSAGES.PARSE_ERROR,
        500
      );
    }
  }
  
  // Binary response handler
  if (isBinary) {
    const blobData = await response.blob();
    return {
      success: true,
      data: blobData as any
    };
  }
  
  // Leere erfolgreiche Antwort
  return { success: true };
}

/**
 * Gibt eine Standardfehlermeldung basierend auf dem HTTP-Statuscode zurück
 */
function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400: return ERROR_MESSAGES.VALIDATION;
    case 401: return ERROR_MESSAGES.UNAUTHORIZED;
    case 403: return ERROR_MESSAGES.FORBIDDEN;
    case 404: return ERROR_MESSAGES.NOT_FOUND;
    case 500: return ERROR_MESSAGES.SERVER;
    default: return ERROR_MESSAGES.DEFAULT;
  }
}

// Token-Aktualisierung mit Vermeidung von Race Conditions
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Aktualisiert das Access Token mit dem Refresh Token
 */
export const refreshAuthToken = async (): Promise<boolean> => {
  if (isRefreshing) {
    return refreshPromise as Promise<boolean>;
  }
  
  isRefreshing = true;
  
  refreshPromise = new Promise(async (resolve) => {
    try {
      const refreshToken = getRefreshToken();
      const accessToken = getAccessToken();
      
      if (!refreshToken) {
        if (accessToken) {
          console.log('Kein Refresh-Token, aber Access-Token vorhanden - Benutzer bleibt eingeloggt');
          resolve(true);
          return;
        }
        resolve(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          setTokens(data.data.accessToken, data.data.refreshToken);
          resolve(true);
          return;
        }
      }
      
      // Bei Fehlschlag prüfen, ob wir noch ein altes Token haben
      if (accessToken) {
        console.log('Token-Refresh fehlgeschlagen, aber altes Token wird weiterhin verwendet');
        resolve(true);
      } else {
        clearTokens();
        resolve(false);
      }
    } catch (error) {
      console.error('Token-Aktualisierung fehlgeschlagen', error);
      
      // Token-Aktualisierungsfehler ignorieren und Benutzer eingeloggt lassen, wenn möglich
      if (getAccessToken()) {
        console.log('Token-Refresh-Fehler aufgetreten, aber altes Token wird weiterhin verwendet');
        resolve(true);
      } else {
        clearTokens();
        resolve(false);
      }
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  });
  
  return refreshPromise;
};

/**
 * Hauptfunktion für API-Anfragen mit automatischem Token-Refresh
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<ApiResponse<T>> {
  // URL zusammenbauen
  let processedEndpoint = endpoint;
  if (!processedEndpoint.startsWith('/')) {
    processedEndpoint = '/' + processedEndpoint;
  }
  
  const url = `${API_BASE_URL}${processedEndpoint}`;
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('API Request:', {
      url,
      method: options.method || 'GET',
      requiresAuth,
      body: options.body ? JSON.parse(options.body as string) : null
    });
  }
  
  try {
    // Headers vorbereiten
    const headers = prepareHeaders(options.headers, requiresAuth);
    
    // Optionen zusammenstellen
    const requestOptions: RequestInit = {
      ...options,
      headers
    };
    
    // Anfrage ausführen
    let response = await fetch(url, requestOptions);
    
    // Token-Aktualisierung versuchen, wenn 401 Unauthorized zurückgegeben wird
    if (response.status === 401 && requiresAuth) {
      const refreshed = await refreshAuthToken();
      
      if (refreshed) {
        // Anfrage mit neuem Token wiederholen
        const newHeaders = prepareHeaders(options.headers, true);
        const newOptions = {
          ...options,
          headers: newHeaders
        };
        
        response = await fetch(url, newOptions);
      } else {
        // Zur Login-Seite weiterleiten, falls erforderlich
        if (!getAccessToken() && !getRefreshToken() && typeof window !== 'undefined') {
          window.location.href = '/auth/login?session=expired';
          throw new ApiRequestError(ERROR_MESSAGES.SESSION_EXPIRED, 401);
        }
      }
    }
    
    return await handleResponse<T>(response);
  } catch (error) {
    // Netzwerkfehler oder andere nicht-HTTP-Fehler abfangen
    if (!(error instanceof ApiRequestError)) {
      console.error('Network Error:', error);
      throw new ApiRequestError(
        ERROR_MESSAGES.NETWORK,
        0
      );
    }
    
    throw error;
  }
}

/**
 * Hilfsfunktion für GET-Anfragen
 */
export function get<T = any>(endpoint: string, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { method: 'GET' }, requiresAuth);
}

/**
 * Hilfsfunktion für POST-Anfragen
 */
export function post<T = any>(endpoint: string, data?: any, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
  return fetchApi<T>(
    endpoint, 
    { 
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }, 
    requiresAuth
  );
}

/**
 * Hilfsfunktion für PUT-Anfragen
 */
export function put<T = any>(endpoint: string, data?: any, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
  return fetchApi<T>(
    endpoint, 
    { 
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }, 
    requiresAuth
  );
}

/**
 * Hilfsfunktion für PATCH-Anfragen
 */
export function patch<T = any>(endpoint: string, data?: any, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
  return fetchApi<T>(
    endpoint, 
    { 
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }, 
    requiresAuth
  );
}

/**
 * Hilfsfunktion für DELETE-Anfragen
 */
export function del<T = any>(endpoint: string, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { method: 'DELETE' }, requiresAuth);
}

// Zentraler API-Client-Export
export default {
  get,
  post,
  put,
  patch,
  delete: del,
  fetch: fetchApi,
  refreshAuthToken
};
