import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Typen für API-Antworten
export interface ApiResponse<T> {
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

// Funktion zum Anhängen von Authentifizierungsheadern
const appendAuthHeader = (headers: HeadersInit = {}): HeadersInit => {
  const accessToken = getAccessToken();
  
  if (accessToken) {
    return {
      ...headers,
      'Authorization': `Bearer ${accessToken}`
    };
  }
  
  return headers;
};

// Funktion zur Behandlung von API-Antworten
export async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    
    // Versuchen, Fehlerdetails aus der Antwort zu extrahieren
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json() as ApiError;
      throw {
        message: errorData.error || 'Ein Fehler ist aufgetreten',
        statusCode: errorData.statusCode || response.status,
        errors: errorData.errors
      };
    }
    
    // Generischer Fehler, wenn keine JSON-Antwort erhalten wurde
    throw {
      message: `API-Fehler: ${response.status} ${response.statusText}`,
      statusCode: response.status
    };
  }
  
  return response.json() as Promise<ApiResponse<T>>;
}

// Referenz auf refreshToken-Funktion für späteren Import
let refreshTokenFunc: (refreshToken: string) => Promise<ApiResponse<any>> = 
  () => Promise.reject('refreshToken function not initialized');

export const setRefreshTokenFunction = (fn: (refreshToken: string) => Promise<ApiResponse<any>>) => {
  refreshTokenFunc = fn;
};

// Funktion zum Aktualisieren des Tokens, wenn eine 401-Antwort erhalten wird
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

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
      console.error('Token refresh failed', error);
      clearTokens();
      resolve(false);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  });
  
  return refreshPromise;
};

// Hauptfunktion für API-Anfragen mit Authentifizierung und Token-Refresh
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Authentifizierungsheader hinzufügen, wenn erforderlich
    const requestOptions = {
      ...options,
      headers: requiresAuth ? appendAuthHeader(headers) : headers
    };
    
    let response = await fetch(url, requestOptions);
    
    // Token-Aktualisierung versuchen, wenn 401 Unauthorized zurückgegeben wird
    if (response.status === 401 && requiresAuth) {
      const refreshed = await refreshAuthToken();
      
      if (refreshed) {
        // Anfrage mit neuem Token wiederholen
        const newOptions = {
          ...options,
          headers: appendAuthHeader(headers)
        };
        
        response = await fetch(url, newOptions);
      } else {
        // Weiterleiten zur Login-Seite, wenn die Token-Aktualisierung fehlschlägt
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        throw {
          message: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
          statusCode: 401
        };
      }
    }
    
    return handleResponse<T>(response);
  } catch (error: any) {
    console.error('API request failed:', error);
    throw error;
  }
}
