/**
 * Formatiert ein Datum in einen ISO-String
 * Stellt sicher, dass Datumswerte einheitlich formatiert werden
 * 
 * @param date - Datum oder String
 * @returns Formatiertes Datum als String
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  // Wenn es ein String ist, überprüfen ob es ein gültiges Datum ist
  try {
    return new Date(date).toISOString();
  } catch (e) {
    return String(date);
  }
}

/**
 * Formats a date as a relative time string (e.g. "2 hours ago", "just now")
 * 
 * @param date - Date to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const parsedDate = date instanceof Date ? date : new Date(date);
  if (isNaN(parsedDate.getTime())) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);
  
  // Weniger als 1 Minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Weniger als 1 Stunde
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Weniger als 1 Tag
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Weniger als 1 Woche
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // Weniger als 1 Monat
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Standard-Datumsformat für ältere Daten
  return parsedDate.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Prüft, ob ein Wert ein Datum ist
 * 
 * @param value - Zu prüfender Wert
 * @returns Ob der Wert ein gültiges Datum ist
 */
export function isDate(value: any): boolean {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Konvertiert einen String zu einem Datumsobjekt
 * 
 * @param value - Zu konvertierender Wert
 * @returns Datumsobjekt oder null
 */
export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
}
