/**
 * API-Konfiguration für Next.js
 */
import { getAccessToken } from '@/lib/auth';

// API-URLs werden in Next.js typischerweise relativ definiert
const API_BASE_URL = '';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

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
 * Basis-API-Anfrage Funktion
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const isAbsoluteUrl = endpoint.startsWith('http');
  const url = isAbsoluteUrl ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const token = getAccessToken();
  
  const fetchOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }
    
    if (!response.ok) {
      throw new ApiRequestError(
        data.message || data.error || 'Anfragefehler',
        response.status,
        data.errors || []
      );
    }
    
    return {
      success: true,
      message: data.message || 'Erfolg',
      data: data.data || data,
    };
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    
    throw new ApiRequestError(
      error instanceof Error ? error.message : 'Netzwerkfehler',
      0
    );
  }
}

// HTTP-Methoden
export function get<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { ...options, method: 'GET' });
}

export function post<T = any>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function put<T = any>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function del<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { ...options, method: 'DELETE' });
}

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
