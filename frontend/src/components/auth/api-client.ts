/**
 * Authentifizierungs-API-Client
 * Direkter API-Client für Auth-Komponenten
 */

// API-URL aus der Umgebung oder Standard-URL (relative URL zum selben Server)
const API_URL = '/api';

// Typen
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
    accessToken: string;
    refreshToken: string;
  };
  errors?: string[];
}

// Login mit Email und Passwort
export async function login(email: string, password: string, remember = false): Promise<AuthResponse> {
  try {
    // Wir versuchen zuerst den einfachen Login
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, remember }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login API error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Fehler bei der Verbindung zum Server',
    };
  }
}

// Refresh-Token-Funktion
export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Refresh token API error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Fehler bei der Verbindung zum Server',
    };
  }
}

// Logout-Funktion
export async function logout(refreshToken?: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Logout API error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Fehler bei der Verbindung zum Server',
    };
  }
}
