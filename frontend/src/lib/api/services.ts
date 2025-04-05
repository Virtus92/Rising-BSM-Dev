import { get, post, put, del as deleteRequest } from './config';
import {
  Service,
  ServiceCreateRequest,
  ServiceUpdateRequest,
  ServiceStatusUpdateRequest,
  ServiceResponse,
  ServicesResponse
} from './types';

/**
 * Ruft alle Dienstleistungen ab mit optionaler Filterung
 */
export function getServices(params?: Record<string, any>) {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return get<ServicesResponse>(`/services${queryString}`);
}

/**
 * Ruft eine Dienstleistung anhand ihrer ID ab
 */
export function getServiceById(id: number | string) {
  return get<ServiceResponse>(`/services/${id}`);
}

/**
 * Erstellt eine neue Dienstleistung
 */
export function createService(data: ServiceCreateRequest) {
  return post<ServiceResponse>('/services', data);
}

/**
 * Aktualisiert eine bestehende Dienstleistung
 */
export function updateService(id: number | string, data: ServiceUpdateRequest) {
  return put<ServiceResponse>(`/services/${id}`, data);
}

/**
 * Ändert den Aktiv-Status einer Dienstleistung
 */
export function toggleServiceStatus(id: number | string, data: ServiceStatusUpdateRequest) {
  return put<ServiceResponse>(`/services/${id}/status`, data);
}

/**
 * Löscht eine Dienstleistung
 */
export function deleteService(id: number | string) {
  return deleteRequest<{ success: boolean; id: number }>(`/services/${id}`);
}
