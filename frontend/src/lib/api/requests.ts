import { get, post, put } from './config';
import {
  Request,
  RequestNote,
  RequestStatusUpdateRequest,
  RequestAssignRequest,
  RequestNoteCreateRequest,
  RequestResponse,
  RequestsResponse
} from './types';

/**
 * Ruft alle Anfragen ab mit optionaler Filterung und Paginierung
 */
export function getRequests(params?: Record<string, any>) {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return get<RequestsResponse>(`/requests${queryString}`);
}

/**
 * Ruft eine einzelne Anfrage anhand ihrer ID ab
 */
export function getRequestById(id: number | string) {
  return get<RequestResponse>(`/requests/${id}`);
}

/**
 * Aktualisiert den Status einer Anfrage
 */
export function updateRequestStatus(id: number | string, data: RequestStatusUpdateRequest) {
  return put<RequestResponse>(`/requests/${id}/status`, data);
}

/**
 * Weist eine Anfrage einem Bearbeiter zu
 */
export function assignRequest(id: number | string, data: RequestAssignRequest) {
  return put<RequestResponse>(`/requests/${id}/assign`, data);
}

/**
 * Fügt eine Notiz zu einer Anfrage hinzu
 */
export function addRequestNote(id: number | string, text: string) {
  return post<{ note: RequestNote }>(`/requests/${id}/notes`, { text });
}
