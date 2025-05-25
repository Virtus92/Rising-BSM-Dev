/**
 * Minimal logging service that delegates to console
 * This avoids any initialization issues during development
 */
export function getLogger() {
  return {
    info: (message: string, meta?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[INFO] ${message}`, meta || '');
      }
    },
    warn: (message: string, meta?: any) => {
      console.warn(`[WARN] ${message}`, meta || '');
    },
    error: (message: string, meta?: any) => {
      console.error(`[ERROR] ${message}`, meta || '');
    },
    debug: (message: string, meta?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[DEBUG] ${message}`, meta || '');
      }
    }
  };
}
