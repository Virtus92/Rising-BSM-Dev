import { NextRequest, NextResponse } from 'next/server';
import { ILoggingService } from '../interfaces/ILoggingService';

interface CacheConfig {
  maxAge: number; // in Sekunden
  private?: boolean;
  staleWhileRevalidate?: number; // in Sekunden
  varyByHeaders?: string[]; // Cache-Variationen je nach Header
  varyByQuery?: string[]; // Cache-Variationen je nach Query-Parametern
}

interface CacheEntry {
  response: NextResponse;
  timestamp: number;
  expiresAt: number;
}

/**
 * Einfacher In-Memory-Cache
 * In Produktion sollte ein verteilter Cache wie Redis verwendet werden
 */
const cache = new Map<string, CacheEntry>();

/**
 * Cache-Schlüssel aus Request generieren
 */
function generateCacheKey(
  req: NextRequest, 
  config: CacheConfig
): string {
  const url = req.nextUrl.pathname + req.nextUrl.search;
  const parts = [url];
  
  // Cache-Variationen je nach Header
  if (config.varyByHeaders?.length) {
    for (const header of config.varyByHeaders) {
      const value = req.headers.get(header) || '';
      parts.push(`${header}=${value}`);
    }
  }
  
  // Cache-Variationen je nach Query-Parametern
  if (config.varyByQuery?.length) {
    for (const param of config.varyByQuery) {
      const value = req.nextUrl.searchParams.get(param) || '';
      parts.push(`${param}=${value}`);
    }
  }
  
  return parts.join('|');
}

/**
 * Cache-Middleware für API-Endpunkte
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: CacheConfig,
  logger?: ILoggingService
) {
  return async (req: NextRequest) => {
    // Nur GET-Requests cachen
    if (req.method !== 'GET') {
      return handler(req);
    }

    const now = Date.now();
    const cacheKey = generateCacheKey(req, config);
    const cachedEntry = cache.get(cacheKey);
    
    // Cache-Treffer innerhalb der Gültigkeitsdauer
    if (cachedEntry && now < cachedEntry.expiresAt) {
      logger?.debug(`Cache HIT: ${req.nextUrl.pathname}`, { cacheKey });
      
      // Kopie der gespeicherten Antwort erstellen
      const response = cachedEntry.response.clone();
      
      // Cache-Header hinzufügen
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Remaining', `${Math.round((cachedEntry.expiresAt - now) / 1000)}s`);
      
      return response;
    }
    
    // Cache-Treffer außerhalb der Gültigkeitsdauer, aber innerhalb von staleWhileRevalidate
    // Stale-While-Revalidate: Gibt veralteten Inhalt zurück, während im Hintergrund aktualisiert wird
    if (cachedEntry && 
        config.staleWhileRevalidate && 
        now < cachedEntry.expiresAt + (config.staleWhileRevalidate * 1000)) {
      
      logger?.debug(`Cache STALE: ${req.nextUrl.pathname}`, { cacheKey });
      
      // Im Hintergrund neu laden
      setTimeout(async () => {
        try {
          logger?.debug(`Revalidating: ${req.nextUrl.pathname}`, { cacheKey });
          const freshResponse = await handler(req);
          
          if (freshResponse.status >= 200 && freshResponse.status < 300) {
            updateCache(cacheKey, freshResponse, config, logger);
          }
        } catch (error) {
          logger?.error(`Revalidation failed: ${req.nextUrl.pathname}`, error instanceof Error ? error : new Error(String(error)));
        }
      }, 10);
      
      // Veralteten Inhalt zurückgeben
      const response = cachedEntry.response.clone();
      response.headers.set('X-Cache', 'STALE');
      return response;
    }

    // Cache-Miss oder abgelaufen
    logger?.debug(`Cache MISS: ${req.nextUrl.pathname}`, { cacheKey });
    const response = await handler(req);
    
    // Nur erfolgreiche Antworten cachen
    if (response.status >= 200 && response.status < 300) {
      updateCache(cacheKey, response, config, logger);
    }

    // Cache-Control Header setzen
    const cacheControl = [
      config.private ? 'private' : 'public',
      `max-age=${config.maxAge}`
    ];
    
    if (config.staleWhileRevalidate) {
      cacheControl.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
    }
    
    response.headers.set('Cache-Control', cacheControl.join(', '));
    response.headers.set('X-Cache', 'MISS');
    
    return response;
  };
}

/**
 * Cache aktualisieren mit neuer Antwort
 */
function updateCache(
  cacheKey: string, 
  response: NextResponse, 
  config: CacheConfig,
  logger?: ILoggingService
) {
  const now = Date.now();
  const expiresAt = now + (config.maxAge * 1000);
  
  cache.set(cacheKey, {
    response: response.clone(),
    timestamp: now,
    expiresAt
  });
  
  logger?.debug(`Cache updated: ${cacheKey}`, { expiresAt: new Date(expiresAt).toISOString() });
}

/**
 * Cache-Eintrag invalidieren
 */
export function invalidateCache(pathPattern: string) {
  const invalidatedKeys: string[] = [];
  
  for (const key of cache.keys()) {
    if (key.includes(pathPattern)) {
      cache.delete(key);
      invalidatedKeys.push(key);
    }
  }
  
  return invalidatedKeys;
}

/**
 * Cache-Statistiken abrufen
 */
export function getCacheStats() {
  const now = Date.now();
  const entries = Array.from(cache.entries());
  
  const stats = {
    totalEntries: entries.length,
    validEntries: 0,
    staleEntries: 0,
    expiredEntries: 0,
    averageAge: 0,
    oldestEntry: 0,
    newestEntry: 0,
    totalSizeEstimate: 0
  };
  
  if (entries.length === 0) {
    return stats;
  }
  
  let totalAge = 0;
  let oldestTime = Infinity;
  let newestTime = 0;
  
  for (const [key, entry] of entries) {
    const age = now - entry.timestamp;
    totalAge += age;
    
    // Größenschätzung
    stats.totalSizeEstimate += key.length * 2; // String-Speicherbedarf (ca. 2 Bytes pro Zeichen)
    
    if (entry.timestamp < oldestTime) {
      oldestTime = entry.timestamp;
    }
    
    if (entry.timestamp > newestTime) {
      newestTime = entry.timestamp;
    }
    
    if (now < entry.expiresAt) {
      stats.validEntries++;
    } else {
      stats.expiredEntries++;
    }
  }
  
  stats.averageAge = Math.round(totalAge / entries.length);
  stats.oldestEntry = now - oldestTime;
  stats.newestEntry = now - newestTime;
  
  return stats;
}
