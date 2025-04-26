/**
 * API-Module
 * 
 * Zentraler Export für alle API-bezogenen Klassen und Funktionen.
 */

// Client für allgemeine HTTP-Anfragen
export { default as ApiClient } from '@/core/api/ApiClient';

// Entitätsspezifische API-Clients
export { UserClient } from './UserClient';
export { CustomerClient } from './CustomerClient';
export { AppointmentClient } from './AppointmentClient';
export { RequestClient } from './RequestClient';
export { NotificationClient } from './NotificationClient';
export { SettingsClient } from './SettingsClient';

// Hilfsfunktionen
export { formatResponse } from './response-formatter';
export { apiRouteHandler } from './route-handler';
