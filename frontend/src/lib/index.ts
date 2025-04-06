/**
 * Haupteinstiegspunkt für die API-Bibliothek
 * 
 * In der NextJS-Welt benötigen wir keinen separaten Express-Server,
 * sondern exportieren stattdessen die erforderlichen Dienste und Hilfsfunktionen
 * für die API-Routen.
 */

// Re-exporte für einfacheren Zugriff
export * from './services/factory';
export * from './utils/api/error';
export * from './utils/api/response';
export * from './config';

// Initialisierungsfunktion für den API-Teil der Anwendung
export function initializeApi() {
  // Import dynamisch, um SSR-Kompatibilität sicherzustellen
  const { initializeCore, initializeRepositories, initializeServices } = require('./services/factory');
  
  // Initialisiere alle erforderlichen Dienste
  initializeCore();
  initializeRepositories();
  initializeServices();
  
  console.log('API-Bibliothek initialisiert');
}