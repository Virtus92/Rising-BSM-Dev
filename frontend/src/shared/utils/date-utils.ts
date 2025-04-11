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
