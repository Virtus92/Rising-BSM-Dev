/**
 * Einstellungen-API-Client
 * Direkter API-Client für Einstellungen-Komponenten
 */

// API-URL aus der Umgebung oder Standard-URL (relative URL zum selben Server)
const API_URL = '/api';

// Typen
export interface SystemSettings {
  companyName: string;
  companyLogo?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyWebsite?: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  [key: string]: any;
}

export interface SettingsResponse {
  success: boolean;
  message: string;
  data?: SystemSettings;
  errors?: string[];
}

// Einstellungen laden
export async function getSettings(): Promise<SettingsResponse> {
  try {
    const response = await fetch(`${API_URL}/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Settings API error:', error);
    // Standardeinstellungen zurückgeben, wenn die API nicht erreichbar ist
    return {
      success: true,
      message: 'Default settings loaded',
      data: {
        companyName: 'Rising BSM',
        dateFormat: 'dd.MM.yyyy',
        timeFormat: 'HH:mm',
        currency: 'EUR',
        language: 'de',
        theme: 'system'
      }
    };
  }
}

// Einstellung aktualisieren
export async function updateSettings(key: string, value: any): Promise<SettingsResponse> {
  try {
    const response = await fetch(`${API_URL}/settings/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Settings update API error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Fehler bei der Verbindung zum Server',
    };
  }
}
