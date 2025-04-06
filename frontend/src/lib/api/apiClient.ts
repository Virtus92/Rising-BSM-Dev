import { toast } from 'sonner';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/lib/auth';

// API Basis-URL
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
  PARSE_ERROR: 'Fehler beim Verarbeiten der Serverantwort',
  RATE_LIMIT: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut'
}

// Typen für API-Antworten
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      current: number;
      limit: number;
      total: number;
      totalRecords: number;
    };
    filters?: Record<string, any>;
  };
}

// Optionen für API-Anfragen
export interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
  skipErrorToast?: boolean;
  retries?: number;
  abortSignal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined | null>;
}

// Erweiterte Error-Klasse für API-Fehler
export class ApiError extends Error {
  statusCode: number;
  errors?: string[];
  requestId?: string;
  
  constructor(message: string, statusCode: number = 500, errors?: string[], requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.requestId = requestId;
  }
}

/**
 * Generiert eine URL mit Query-Parametern
 */
function buildUrl(endpoint: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const url = new URL(endpoint, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.pathname + url.search;
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
export async function handleResponse<T>(
  response: Response, 
  skipErrorToast: boolean = false
): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const requestId = response.headers.get('X-Request-ID') || undefined;
  
  if (!response.ok) {
    // Versuchen, Fehlerdetails aus der Antwort zu extrahieren
    if (isJson) {
      try {
        const errorData = await response.json() as ApiResponse;
        
        if (!skipErrorToast && errorData.error) {
          toast.error(errorData.error);
        }
        
        throw new ApiError(
          errorData.error || getDefaultErrorMessage(response.status),
          response.status,
          errorData.errors,
          requestId || errorData.meta?.requestId
        );
      } catch (error) {
        // Falls die JSON-Verarbeitung fehlschlägt oder keine API-Error ist
        if (error instanceof ApiError) throw error;
        
        const defaultMessage = getDefaultErrorMessage(response.status);
        
        if (!skipErrorToast) {
          toast.error(defaultMessage);
        }
        
        throw new ApiError(defaultMessage, response.status, undefined, requestId);
      }
    }
    
    // Wenn keine JSON-Antwort, generischen Fehler basierend auf Status werfen
    const defaultMessage = getDefaultErrorMessage(response.status);
    
    if (!skipErrorToast) {
      toast.error(defaultMessage);
    }
    
    throw new ApiError(defaultMessage, response.status, undefined, requestId);
  }
  
  // Erfolgreiche Antwort verarbeiten
  if (isJson) {
    try {
      const jsonData = await response.json() as ApiResponse<T>;
      return jsonData;
    } catch (error) {
      if (!skipErrorToast) {
        toast.error(ERROR_MESSAGES.PARSE_ERROR);
      }
      
      throw new ApiError(ERROR_MESSAGES.PARSE_ERROR, 500, undefined, requestId);
    }
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
    case 429: return ERROR_MESSAGES.RATE_LIMIT;
    case 500: return ERROR_MESSAGES.SERVER;
    default: return ERROR_MESSAGES.DEFAULT;
  }
}

// Referenz auf refreshToken-Funktion für späteren Import
let refreshTokenFunc: (refreshToken: string) => Promise<ApiResponse<any>> = 
  () => Promise.reject('refreshToken-Funktion nicht initialisiert');

export const setRefreshTokenFunction = (fn: (refreshToken: string) => Promise<ApiResponse<any>>) => {
  refreshTokenFunc = fn;
};

// Token-Aktualisierung mit Vermeidung von Race Conditions
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Aktualisiert das Access Token mit dem Refresh Token
 */
const refreshAuthToken = async (): Promise<boolean> => {
  if (isRefreshing) {
    return refreshPromise as Promise<boolean>;
  }
  
  isRefreshing = true;
  
  refreshPromise = new Promise(async (resolve) => {
    try {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        resolve(false);
        return;
      }
      
      const response = await refreshTokenFunc(refreshToken);
      
      if (response.success && response.data) {
        setTokens(response.data.accessToken, response.data.refreshToken);
        resolve(true);
      } else {
        clearTokens();
        resolve(false);
      }
    } catch (error) {
      console.error('Token-Aktualisierung fehlgeschlagen', error);
      clearTokens();
      resolve(false);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  });
  
  return refreshPromise;
};

/**
 * Führt eine API-Anfrage mit retry-Logik und automatischem Token-Refresh aus
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    requiresAuth = true,
    method = 'GET',
    body,
    headers = {},
    params,
    skipErrorToast = false,
    retries = 1,
    abortSignal,
    ...restOptions
  } = options;
  
  // URL mit Query-Parametern bauen
  let processedEndpoint = endpoint;
  if (!processedEndpoint.startsWith('/')) {
    processedEndpoint = '/' + processedEndpoint;
  }
  
  const url = buildUrl(`${API_BASE_URL}${processedEndpoint}`, params);
  
  // Headers vorbereiten
  const requestHeaders = prepareHeaders(headers, requiresAuth);
  
  // Request-Optionen
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    signal: abortSignal,
    ...restOptions
  };
  
  // Body hinzufügen, falls vorhanden
  if (body) {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  try {
    // Anfrage ausführen
    let response = await fetch(url, requestOptions);
    
    // Token-Aktualisierung versuchen, wenn 401 Unauthorized zurückgegeben wird
    if (response.status === 401 && requiresAuth) {
      const refreshed = await refreshAuthToken();
      
      if (refreshed) {
        // Anfrage mit neuem Token wiederholen
        const newHeaders = prepareHeaders(headers, true);
        const newOptions = {
          ...requestOptions,
          headers: newHeaders
        };
        
        response = await fetch(url, newOptions);
      } else {
        // Weiterleiten zur Login-Seite, wenn die Token-Aktualisierung fehlschlägt
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login?session=expired';
        }
        throw new ApiError(ERROR_MESSAGES.SESSION_EXPIRED, 401);
      }
    }
    
    return await handleResponse<T>(response, skipErrorToast);
  } catch (error) {
    // Wenn der Request abgebrochen wurde, den Fehler weiterwerfen
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    
    // Retry-Logik für vorübergehende Fehler
    if (retries > 0 && !(error instanceof ApiError) && error instanceof Error) {
      console.warn(`Wiederhole Anfrage (${retries} verbleibend)...`, error.message);
      return fetchApi<T>(endpoint, {
        ...options,
        retries: retries - 1
      });
    }
    
    // Netzwerkfehler abfangen
    if (!(error instanceof ApiError)) {
      if (!skipErrorToast) {
        toast.error(ERROR_MESSAGES.NETWORK);
      }
      
      throw new ApiError(
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
export function get<T = any>(
  endpoint: string, 
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * Hilfsfunktion für POST-Anfragen
 */
export function post<T = any>(
  endpoint: string, 
  data?: any, 
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { ...options, method: 'POST', body: data });
}

/**
 * Hilfsfunktion für PUT-Anfragen
 */
export function put<T = any>(
  endpoint: string, 
  data?: any, 
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { ...options, method: 'PUT', body: data });
}

/**
 * Hilfsfunktion für PATCH-Anfragen
 */
export function patch<T = any>(
  endpoint: string, 
  data?: any, 
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { ...options, method: 'PATCH', body: data });
}

/**
 * Hilfsfunktion für DELETE-Anfragen
 */
export function del<T = any>(
  endpoint: string, 
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Hilfsfunktion für das Hochladen von Dateien
 */
export async function uploadFile<T = any>(
  endpoint: string,
  file: File,
  additionalFields?: Record<string, string>,
  options: Omit<ApiRequestOptions, 'method' | 'body' | 'headers'> = {}
): Promise<ApiResponse<T>> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalFields) {
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'POST',
    body: formData,
    headers: {}, // Content-Type Header wird automatisch gesetzt
  });
}

// Initialisiere die Refresh-Token-Funktion
setRefreshTokenFunction(async (refreshToken: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
    
    return await handleResponse(response, true);
  } catch (error) {
    console.error('Token refresh failed:', error);
    return { success: false, error: 'Token refresh failed' };
  }
});
