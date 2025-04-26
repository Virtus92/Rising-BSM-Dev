/**
 * Next.js Instrumentation
 * Diese Datei wird von Next.js beim Start geladen.
 * 
 * Hier initialisieren wir unsere Backend-Dienste einheitlich mit dem 
 * Bootstrap-System aus der Infrastrukturschicht.
 */

// Flag this file as server-only
import 'server-only';

// Use dynamic import to ensure we only load server code in server context
export async function register() {
  try {
    // Check if we're in a true server environment (not browser or edge)
    if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
      const { bootstrapServer } = await import('@/core/bootstrap/bootstrap.server');
      // Initialize the application with the server bootstrap system
      await bootstrapServer();
    } else {
      console.log('Skipping server bootstrap in non-server environment');
    }
  } catch (error) {
    console.error('Fehler bei der Anwendungsinitialisierung:', error as Error);
  }
}
