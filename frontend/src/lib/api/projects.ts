import { get, post, put, del as deleteRequest } from './config';
import {
  Project,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectStatusUpdateRequest,
  ProjectResponse,
  ProjectsResponse
} from './types';

/**
 * Ruft alle Projekte ab mit optionaler Filterung und Paginierung
 */
export function getProjects(params?: Record<string, any>) {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return get<ProjectsResponse>(`/projects${queryString}`);
}

/**
 * Ruft ein Projekt anhand seiner ID ab
 */
export function getProjectById(id: number | string) {
  return get<ProjectResponse>(`/projects/${id}`);
}

/**
 * Erstellt ein neues Projekt
 */
export function createProject(data: ProjectCreateRequest) {
  return post<ProjectResponse>('/projects', data);
}

/**
 * Aktualisiert ein bestehendes Projekt
 */
export function updateProject(id: number | string, data: ProjectUpdateRequest) {
  return put<ProjectResponse>(`/projects/${id}`, data);
}

/**
 * Aktualisiert den Status eines Projekts
 */
export function updateProjectStatus(id: number | string, data: ProjectStatusUpdateRequest) {
  return put<ProjectResponse>(`/projects/${id}/status`, data);
}

/**
 * Löscht ein Projekt
 */
export function deleteProject(id: number | string) {
  return deleteRequest<{ success: boolean; id: number }>(`/projects/${id}`);
}

/**
 * Fügt eine Notiz zu einem Projekt hinzu
 */
export function addProjectNote(id: number | string, text: string) {
  return post<{ success: boolean }>(`/projects/${id}/notes`, { text });
}

/**
 * Ruft Projektstatistiken ab
 */
export function getProjectStatistics(params?: Record<string, any>) {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return get(`/projects/statistics${queryString}`);
}
