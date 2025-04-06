/**
 * API-Module-Export
 * Zentraler Export aller API-Funktionen
 */

// Re-export der Konfigurationsfunktionen
export * from './config';

// Re-export der grundlegenden API-Clients
export * as auth from './auth';
export * as settings from './settings';
export * as notifications from './notifications';
export * as users from './users';
export * as dashboard from './dashboard';
export * as customers from './customers';
export * as projects from './projects';
export * as services from './services';
export * as appointments from './appointments';
