/**
 * Users API-Client
 * Enthält alle Funktionen für Benutzerverwaltung
 */
import { get, post, put, del, ApiResponse } from './config';

// Typen für Benutzerdaten
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: number;
  userId: number;
  position?: string;
  department?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role: string;
  profile?: Partial<UserProfile>;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
  profile?: Partial<UserProfile>;
}

// Benutzer API-Funktionen

/**
 * Hole alle Benutzer
 */
export async function getUsers(options: { limit?: number; page?: number; search?: string } = {}): Promise<ApiResponse<User[]>> {
  const params = new URLSearchParams();
  
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.page) params.append('page', options.page.toString());
  if (options.search) params.append('search', options.search);
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return get(`/users${queryString}`);
}

/**
 * Hole einen Benutzer nach ID
 */
export async function getUser(id: number): Promise<ApiResponse<User>> {
  return get(`/users/${id}`);
}

/**
 * Hole das Profil des aktuellen Benutzers
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return get('/users/me');
}

/**
 * Erstelle einen neuen Benutzer
 */
export async function createUser(user: CreateUserRequest): Promise<ApiResponse<User>> {
  return post('/users', user);
}

/**
 * Aktualisiere einen Benutzer
 */
export async function updateUser(id: number, user: UpdateUserRequest): Promise<ApiResponse<User>> {
  return put(`/users/${id}`, user);
}

/**
 * Aktualisiere das Profil des aktuellen Benutzers
 */
export async function updateCurrentUser(user: UpdateUserRequest): Promise<ApiResponse<User>> {
  return put('/users/me', user);
}

/**
 * Lösche einen Benutzer
 */
export async function deleteUser(id: number): Promise<ApiResponse<{ success: boolean }>> {
  return del(`/users/${id}`);
}

/**
 * Benutzer aktivieren
 */
export async function activateUser(id: number): Promise<ApiResponse<User>> {
  return put(`/users/${id}/activate`, {});
}

/**
 * Benutzer deaktivieren
 */
export async function deactivateUser(id: number): Promise<ApiResponse<User>> {
  return put(`/users/${id}/deactivate`, {});
}
