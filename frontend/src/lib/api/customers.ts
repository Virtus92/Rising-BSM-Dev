import { get, post, put, del as deleteRequest } from './config';
import {
  Customer,
  CustomerCreateRequest,
  CustomerUpdateRequest,
  CustomerStatusUpdateRequest,
  CustomerResponse,
  CustomersResponse
} from './types';

/**
 * Ruft alle Kunden ab mit optionaler Filterung und Paginierung
 */
export function getCustomers(params?: Record<string, any>) {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return get<CustomersResponse>(`/customers${queryString}`);
}

/**
 * Ruft einen Kunden anhand seiner ID ab
 */
export function getCustomerById(id: number | string) {
  return get<CustomerResponse>(`/customers/${id}`);
}

/**
 * Erstellt einen neuen Kunden
 */
export function createCustomer(data: CustomerCreateRequest) {
  return post<CustomerResponse>('/customers', data);
}

/**
 * Aktualisiert einen bestehenden Kunden
 */
export function updateCustomer(id: number | string, data: CustomerUpdateRequest) {
  return put<CustomerResponse>(`/customers/${id}`, data);
}

/**
 * Aktualisiert den Status eines Kunden
 */
export function updateCustomerStatus(id: number | string, data: CustomerStatusUpdateRequest) {
  return put<CustomerResponse>(`/customers/${id}/status`, data);
}

/**
 * Löscht einen Kunden (Soft-Delete)
 */
export function deleteCustomer(id: number | string, mode: 'soft' | 'hard' = 'soft') {
  return deleteRequest<{ success: boolean; id: number }>(`/customers/${id}?mode=${mode}`);
}

/**
 * Fügt eine Notiz zu einem Kunden hinzu
 */
export function addCustomerNote(id: number | string, text: string) {
  return post<{ success: boolean }>(`/customers/${id}/notes`, { text });
}

/**
 * Sucht nach Kunden mit dem angegebenen Suchbegriff
 */
export function searchCustomers(term: string, page: number = 1, limit: number = 20) {
  return get<CustomersResponse>(`/customers/search?term=${term}&page=${page}&limit=${limit}`);
}
