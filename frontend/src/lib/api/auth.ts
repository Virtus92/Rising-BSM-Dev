import { 
  fetchApi, 
  ApiResponse, 
  post, 
  get 
} from './client';

import {
  LoginDto,
  AuthResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto
} from '../dtos/AuthDtos';

/**
 * Führt die Benutzeranmeldung durch
 * @param email E-Mail-Adresse des Benutzers
 * @param password Passwort des Benutzers
 * @param remember Flag, ob der Benutzer länger angemeldet bleiben soll
 * @returns API-Antwort mit Login-Daten
 */
export function login(email: string, password: string, remember: boolean = false): Promise<ApiResponse<AuthResponseDto>> {
  console.log("Sending login request with:", { email, password: "***", remember });
  
  const loginData: LoginDto = { email, password, remember };
  
  // Hier senden wir die Anfrage an den korrekten Endpoint
  return post<AuthResponseDto>(
    '/auth/login',
    loginData,
    false // Keine Authentifizierung erforderlich für Login
  );
}

/**
 * Aktualisiert das Access Token mit dem Refresh Token
 * @param refreshToken Das aktuelle Refresh Token
 * @returns API-Antwort mit neuen Tokens
 */
export function refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponseDto>> {
  const refreshData: RefreshTokenDto = { refreshToken };
  
  return post<RefreshTokenResponseDto>(
    '/auth/refresh', // Korrigiert auf den korrekten Endpunkt
    refreshData,
    false // Keine Authentifizierung erforderlich für Token-Aktualisierung
  );
}

/**
 * Führt den Benutzer-Logout durch
 * @param refreshToken Das aktuelle Refresh Token zum Invalidieren
 * @returns API-Antwort
 */
export function logout(refreshToken: string): Promise<ApiResponse<{ success: boolean; tokenCount: number }>> {
  return post(
    '/auth/logout',
    { refreshToken },
    true // Authentifizierung erforderlich für Logout
  );
}

/**
 * Sendet eine Passwort-Zurücksetzen-Anfrage
 * @param email E-Mail-Adresse des Benutzers
 * @returns API-Antwort
 */
export function forgotPassword(email: string): Promise<ApiResponse<{ success: boolean }>> {
  const forgotPasswordData: ForgotPasswordDto = { email };
  
  return post(
    '/auth/forgot-password',
    forgotPasswordData,
    false // Keine Authentifizierung erforderlich
  );
}

/**
 * Setzt das Passwort mit einem Reset-Token zurück
 * @param token Das Reset-Token aus der E-Mail
 * @param password Das neue Passwort
 * @param confirmPassword Bestätigung des neuen Passworts
 * @returns API-Antwort
 */
export function resetPassword(
  token: string, 
  password: string, 
  confirmPassword: string
): Promise<ApiResponse<{ success: boolean }>> {
  const resetPasswordData: ResetPasswordDto = { 
    token,
    password, 
    confirmPassword 
  };
  
  return post(
    '/auth/reset-password',
    resetPasswordData,
    false // Keine Authentifizierung erforderlich
  );
}

/**
 * Validiert ein Reset-Token
 * @param token Das zu validierende Reset-Token
 * @returns API-Antwort mit Validierungsinformationen
 */
export function validateResetToken(token: string): Promise<ApiResponse<{ valid: boolean }>> {
  return get<{ valid: boolean }>(
    `/auth/validate-reset-token/${token}`,
    false // Keine Authentifizierung erforderlich
  );
}
