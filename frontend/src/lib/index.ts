/**
 * Haupteinstiegspunkt für die API-Bibliothek
 * 
 * Vereinfachter Export der wichtigsten Funktionen und Dienstleistungen
 * für die API-Routen.
 */

// Saubere Exporte für einfacheren Zugriff auf die wichtigsten Funktionen
export * from './factories';
export * from './utils/api/error';

// Verwende nur unified-response.ts für ApiResponse, um doppelte Exporte zu vermeiden
export * from './utils/api/unified-response';

export * from './config';
export * from './core/bootstrap';
