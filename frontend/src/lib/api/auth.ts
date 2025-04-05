import { fetchApi, ApiResponse, setRefreshTokenFunction, post, get } from './config';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ResetTokenResponse {
  valid: boolean;
  userId: number;
  email: string;
}

/**
 * Führt die Benutzeranmeldung durch
 * @param email E-Mail-Adresse des Benutzers
 * @param password Passwort des Benutzers
 * @param remember Flag, ob der Benutzer länger angemeldet bleiben soll
 * @returns API-Antwort mit Login-Daten
 */
export function login(email: string, password: string, remember: boolean = false): Promise<ApiResponse<LoginResponse>> {
  console.log("Sending login request with:", { email, password: "***", remember });
  
  // Hier senden wir die Anfrage an den korrekten Endpoint
  return post<LoginResponse>(
    '/login',
    { email, password, remember },
    false // Keine Authentifizierung erforderlich für Login
  );
}

/**
 * Aktualisiert das Access Token mit dem Refresh Token
 * @param refreshToken Das aktuelle Refresh Token
 * @returns API-Antwort mit neuen Tokens
 */
export function refreshToken(refreshToken: string): Promise<ApiResponse<TokenResponse>> {
  return post<TokenResponse>(
    '/auth/refresh-token',
    { refreshToken },
    false // Keine Authentifizierung erforderlich für Token-Aktualisierung
  );
}

// Registriere die refreshToken-Funktion bei der API-Konfiguration
setRefreshTokenFunction(refreshToken);

/**
 * Führt den Benutzer-Logout durch
 * @param refreshToken Das aktuelle Refresh Token zum Invalidieren
 * @returns API-Antwort
 */
export function logout(refreshToken: string): Promise<ApiResponse> {
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
export function forgotPassword(email: string): Promise<ApiResponse> {
  return post(
    '/auth/forgot-password',
    { email },
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
): Promise<ApiResponse> {
  return post(
    `/auth/reset-password/${token}`,
    { password, confirmPassword },
    false // Keine Authentifizierung erforderlich
  );
}

/**
 * Validiert ein Reset-Token
 * @param token Das zu validierende Reset-Token
 * @returns API-Antwort mit Validierungsinformationen
 */
export function validateResetToken(token: string): Promise<ApiResponse<ResetTokenResponse>> {
  return get<ResetTokenResponse>(
    `/auth/reset-token/${token}`,
    false // Keine Authentifizierung erforderlich
  );
}
