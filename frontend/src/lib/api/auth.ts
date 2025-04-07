/**
 * Auth API-Client für Next.js
 */
import { get, post, ApiResponse } from './config';

/**
 * Login mit Benutzername und Passwort
 */
export async function login(email: string, password: string, remember = false): Promise<ApiResponse<any>> {
  return post('/api/auth/login', { email, password, remember });
}

/**
 * Registrierung eines neuen Benutzers
 */
export async function register(userData: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}): Promise<ApiResponse<any>> {
  return post('/api/auth/register', userData);
}

/**
 * Token-Aktualisierung mit Refresh-Token
 */
export async function refreshToken(refreshToken: string): Promise<ApiResponse<any>> {
  return post('/api/auth/refresh', { refreshToken });
}

/**
 * Passwort vergessen (Anfrage zum Zurücksetzen)
 */
export async function forgotPassword(email: string): Promise<ApiResponse<any>> {
  return post('/api/auth/forgot-password', { email });
}

/**
 * Passwort zurücksetzen
 */
export async function resetPassword(token: string, password: string, passwordConfirm: string): Promise<ApiResponse<any>> {
  return post(`/api/auth/reset-password/${token}`, { password, passwordConfirm });
}

/**
 * Passwort ändern (für eingeloggte Benutzer)
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  newPasswordConfirm: string
): Promise<ApiResponse<any>> {
  return post('/api/auth/change-password', {
    currentPassword,
    newPassword,
    newPasswordConfirm
  });
}

/**
 * Benutzer-Logout
 */
export async function logout(refreshToken?: string): Promise<ApiResponse<any>> {
  return post('/api/auth/logout', { refreshToken });
}
