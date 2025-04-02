import { fetchApi, ApiResponse, setRefreshTokenFunction } from './config';

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

export function login(email: string, password: string, remember: boolean = false) {
  return fetchApi<LoginResponse>(
    '/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
    },
    false // Keine Authentifizierung erforderlich für Login
  );
}

export function refreshToken(refreshToken: string) {
  return fetchApi<TokenResponse>(
    '/auth/refresh-token',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    },
    false // Keine Authentifizierung erforderlich für Token-Aktualisierung
  );
}

// Registriere die refreshToken-Funktion bei der API-Konfiguration
setRefreshTokenFunction(refreshToken);

export function logout(refreshToken: string) {
  return fetchApi(
    '/auth/logout',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    },
    true
  );
}

export function forgotPassword(email: string) {
  return fetchApi(
    '/auth/forgot-password',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
    false
  );
}

export function resetPassword(token: string, password: string, confirmPassword: string) {
  return fetchApi(
    `/auth/reset-password/${token}`,
    {
      method: 'POST',
      body: JSON.stringify({ password, confirmPassword }),
    },
    false
  );
}

export function validateResetToken(token: string) {
  return fetchApi(
    `/auth/validate-reset-token/${token}`,
    {
      method: 'GET',
    },
    false
  );
}