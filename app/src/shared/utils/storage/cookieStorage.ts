'use client';

/**
 * CookieStorage
 * 
 * A secure cookie-based storage implementation that replaces localStorage
 * with enhanced security features and proper error handling.
 */

const DEFAULT_CONFIG = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days default
  domain: typeof window !== 'undefined' ? window.location.hostname : undefined,
};

/**
 * Error class for cookie storage operations
 */
export class CookieStorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'CookieStorageError';
    Object.setPrototypeOf(this, CookieStorageError.prototype);
  }
}

/**
 * Set a cookie with the given name, value, and options
 * 
 * @param name Cookie name
 * @param value Cookie value
 * @param options Cookie options
 * @throws CookieStorageError if operation fails
 */
export function setItem(name: string, value: string, options: Partial<typeof DEFAULT_CONFIG> = {}): void {
  try {
    if (!name) {
      throw new CookieStorageError('Cookie name is required', 'MISSING_COOKIE_NAME');
    }

    const config = { ...DEFAULT_CONFIG, ...options };
    const cookieValue = encodeURIComponent(value);
    
    let cookie = `${name}=${cookieValue};path=${config.path}`;
    
    if (config.maxAge !== undefined) {
      cookie += `;max-age=${config.maxAge}`;
    }
    
    if (config.secure) {
      cookie += ';secure';
    }
    
    cookie += `;SameSite=${config.sameSite}`;
    
    document.cookie = cookie;
    
    // Simplified verification - only log warnings in dev mode
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const verifyValue = getItem(name);
        if (!verifyValue && value) {
          console.debug(
            `Cookie '${name}' verification: ` +
            `Value length: ${value.length}, Name: ${name}`
          );
        }
      }, 100);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error setting cookie '${name}':`, error);
    
    throw new CookieStorageError(
      `Failed to set cookie: ${errorMessage}`,
      'SET_COOKIE_FAILED',
      error
    );
  }
}

/**
 * Get a cookie by name
 * 
 * @param name Cookie name
 * @returns Cookie value or null if not found
 * @throws CookieStorageError if operation fails
 */
export function getItem(name: string): string | null {
  try {
    if (!name) {
      throw new CookieStorageError('Cookie name is required', 'MISSING_COOKIE_NAME');
    }
    
    if (typeof document === 'undefined') {
      return null; // SSR environment
    }
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      
      return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error getting cookie '${name}':`, error);
    
    throw new CookieStorageError(
      `Failed to get cookie: ${errorMessage}`,
      'GET_COOKIE_FAILED',
      error
    );
  }
}

/**
 * Remove a cookie by name
 * 
 * @param name Cookie name
 * @param options Cookie options
 * @throws CookieStorageError if operation fails
 */
export function removeItem(name: string, options: Partial<Pick<typeof DEFAULT_CONFIG, 'path' | 'secure' | 'sameSite'>> = {}): void {
  try {
    if (!name) {
      throw new CookieStorageError('Cookie name is required', 'MISSING_COOKIE_NAME');
    }
    
    const config = { ...DEFAULT_CONFIG, ...options, maxAge: -1 };
    
    // Setting max-age to -1 or expires to past date removes the cookie
    document.cookie = `${name}=;path=${config.path};max-age=-1;${config.secure ? 'secure;' : ''}SameSite=${config.sameSite}`;
    
    // Verify cookie was removed only in development mode
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const verifyValue = getItem(name);
        if (verifyValue) {
          console.debug(`Cookie removal verification: '${name}'`);
        }
      }, 100);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error removing cookie '${name}':`, error);
    
    throw new CookieStorageError(
      `Failed to remove cookie: ${errorMessage}`,
      'REMOVE_COOKIE_FAILED',
      error
    );
  }
}

/**
 * Check if cookie is enabled in the browser
 * 
 * @returns True if cookies are enabled
 */
export function isEnabled(): boolean {
  try {
    const testKey = '__cookie_test__';
    setItem(testKey, 'test', { maxAge: 10 });
    const result = getItem(testKey) === 'test';
    removeItem(testKey);
    return result;
  } catch (e) {
    return false;
  }
}

/**
 * Clear all cookies that belong to the application
 * (limited to cookies that match the prefix if provided)
 * 
 * @param prefix Optional prefix to limit which cookies to clear
 */
export function clear(prefix?: string): void {
  try {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const parts = cookie.split('=');
      const name = parts[0]?.trim();
      
      if (name && (!prefix || name.startsWith(prefix))) {
        removeItem(name);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error clearing cookies:', error);
    
    throw new CookieStorageError(
      `Failed to clear cookies: ${errorMessage}`,
      'CLEAR_COOKIES_FAILED',
      error
    );
  }
}

// Export as default object for compatibility with localStorage API shape
export default {
  getItem,
  setItem,
  removeItem,
  clear,
  isEnabled,
};
