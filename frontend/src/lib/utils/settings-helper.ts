/**
 * Settings-Helper
 * Hilfsfunktionen für die Verwaltung von Einstellungen
 */
import { SystemSettings } from '@/contexts/SettingsContext';

// Globale Variable für clientseitige Einstellungen
let clientSettings: SystemSettings | null = null;

/**
 * Initialisiert die clientseitigen Einstellungen
 */
export function initializeClientSettings(settings: SystemSettings): void {
  clientSettings = settings;
  
  // Theme-Einstellung anwenden
  applyThemeSettings(settings.theme);
}

/**
 * Gibt die aktuellen clientseitigen Einstellungen zurück
 */
export function getClientSettings(): SystemSettings | null {
  return clientSettings;
}

/**
 * Wendet die Theme-Einstellungen an
 */
function applyThemeSettings(theme: 'light' | 'dark' | 'system'): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Systemeinstellung verwenden, wenn 'system' gewählt wurde
  if (theme === 'system') {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', systemPrefersDark);
  } else {
    // Explizite Theme-Einstellung verwenden
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

/**
 * Formatiert ein Datum gemäß den Einstellungen
 */
export function formatDate(date: Date | string | number): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'object' ? date : new Date(date);
  const dateFormat = clientSettings?.dateFormat || 'dd.MM.yyyy';
  
  // Einfache Formatierung (für erweiterte Funktionalität date-fns verwenden)
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  // Formatierung je nach Einstellung
  if (dateFormat === 'dd.MM.yyyy') {
    return `${day}.${month}.${year}`;
  } else if (dateFormat === 'MM/dd/yyyy') {
    return `${month}/${day}/${year}`;
  } else if (dateFormat === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  }
  
  // Standardformat, falls keine Übereinstimmung
  return `${day}.${month}.${year}`;
}

/**
 * Formatiert eine Uhrzeit gemäß den Einstellungen
 */
export function formatTime(date: Date | string | number): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'object' ? date : new Date(date);
  const timeFormat = clientSettings?.timeFormat || 'HH:mm';
  
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  // 24-Stunden-Format
  if (timeFormat === 'HH:mm') {
    return `${hours}:${minutes}`;
  }
  
  // 12-Stunden-Format
  if (timeFormat === 'hh:mm a') {
    const hour12 = dateObj.getHours() % 12 || 12;
    const ampm = dateObj.getHours() >= 12 ? 'PM' : 'AM';
    return `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
  }
  
  // Standardformat, falls keine Übereinstimmung
  return `${hours}:${minutes}`;
}

/**
 * Formatiert einen Währungsbetrag gemäß den Einstellungen
 */
export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null) return '';
  
  const currency = clientSettings?.currency || 'EUR';
  
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
