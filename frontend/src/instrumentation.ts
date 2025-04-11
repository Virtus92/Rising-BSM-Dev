/**
 * Next.js Instrumentation
 * Diese Datei wird von Next.js beim Start geladen.
 * 
 * Hier initialisieren wir unsere Backend-Dienste einheitlich mit dem 
 * Bootstrap-System aus der Infrastrukturschicht.
 */

import { bootstrap } from '@/infrastructure/common/bootstrap';

export async function register() {
  try {
    // Initialisiere die Anwendung mit dem Bootstrap-System der Infrastrukturschicht
    await bootstrap();
  } catch (error) {
    console.error('Fehler bei der Anwendungsinitialisierung:', error);
  }
}
