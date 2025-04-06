/**
 * Next.js Instrumentation
 * Diese Datei wird von Next.js beim Start geladen.
 * 
 * Hier initialisieren wir unsere Backend-Dienste.
 */

import { bootstrap } from './lib/core/bootstrap';

export async function register() {
  try {
    // Initialisiere die Anwendung
    await bootstrap();
  } catch (error) {
    console.error('Fehler bei der Anwendungsinitialisierung:', error);
  }
}
