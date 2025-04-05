import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../auth';

// API Basis-URL aus der Umgebungskonfiguration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/API/v1';

console.log('API Base URL:', API_BASE_URL);

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
}

// Typen für API-Antworten
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    timestamp: string;
    pagination?: {
      current: number;
      limit: number;
      total: number;
      totalRecords: number;
    };
    filters?: Record<string, any>;
  };
}

export interface ApiError {
  success: boolean;
  error: string;
  statusCode: number;
  errors?: string[];
  meta?: {
    timestamp: string;
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
  
  console.log('API Response:', {
    status: response.status,
    statusText: response.statusText,
    isJson,
    url: response.url
  });
  
  if (!response.ok) {
    // Versuchen, Fehlerdetails aus der Antwort zu extrahieren
    if (isJson) {
      try {
        const errorData = await response.json() as ApiError;
        console.error('API Error Response:', errorData);
        
        throw new ApiRequestError(
          errorData.error || getDefaultErrorMessage(response.status),
          errorData.statusCode || response.status,
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
      console.log('API Success Response:', jsonData);
      return jsonData;
    } catch (error) {
      console.error('JSON Parse Error:', error);
      throw new ApiRequestError(
        ERROR_MESSAGES.PARSE_ERROR,
        500
      );
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
  
  console.log('API Request:', {
    url,
    method: options.method || 'GET',
    requiresAuth,
    body: options.body ? JSON.parse(options.body as string) : null
  });
  
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
        // Weiterleiten zur Login-Seite, wenn die Token-Aktualisierung fehlschlägt
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login?session=expired';
        }
        throw new ApiRequestError(ERROR_MESSAGES.SESSION_EXPIRED, 401);
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
