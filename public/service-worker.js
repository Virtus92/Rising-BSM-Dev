/**
 * Service Worker für Rising BSM Dashboard
 * Ermöglicht Offline-Funktionalität und verbessert die Performance 
 */

// Cache-Namen für verschiedene Ressourcentypen
const CACHE_NAME = 'rising-bsm-cache-v1';
const STATIC_CACHE = 'rising-bsm-static-v1';
const API_CACHE = 'rising-bsm-api-v1';
const IMAGE_CACHE = 'rising-bsm-images-v1';

// Zu cachende statische Assets
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline.html',
  '/styles/dashboard.css',
  '/scripts/dashboard.js',
  '/images/logo.png',
  '/images/offline.svg',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://code.jquery.com/jquery-3.6.0.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Neuen Service Worker sofort aktivieren
  );
});

// Aktivierung und Cache-Bereinigung
self.addEventListener('activate', event => {
  const currentCaches = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      })
      .then(cachesToDelete => {
        return Promise.all(cachesToDelete.map(cacheToDelete => {
          console.log('Service Worker: Cleaning old cache:', cacheToDelete);
          return caches.delete(cacheToDelete);
        }));
      })
      .then(() => self.clients.claim()) // Service Worker übernimmt Kontrolle
  );
});

// Fetch-Event-Handler mit Cache-Strategie
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Nur GET-Anfragen behandeln
  if (request.method !== 'GET') {
    return;
  }
  
  // Nicht-HTTPS-Anfragen ignorieren (außer localhost)
  if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
    return;
  }
  
  // API-Anfragen mit Netzwerk-First-Strategie behandeln
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Bild-Anfragen mit Cache-First-Strategie behandeln
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }
  
  // Statische Assets mit Cache-First-Strategie behandeln
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }
  
  // Alle anderen Anfragen mit Netzwerk-First-Strategie behandeln
  event.respondWith(networkFirstStrategy(request));
});

// Cache-First-Strategie für Bilder und statische Assets
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Im Hintergrund aktualisieren
    updateCache(request, cacheName);
    return cachedResponse;
  }
  
  // Nicht im Cache, vom Netzwerk holen
  try {
    const networkResponse = await fetch(request);
    
    // Im Cache speichern
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Wenn offline und Bild angefordert, Fallback-Bild liefern
    if (isImageRequest(request)) {
      return caches.match('/images/offline.svg');
    }
    
    // Keine Fallback-Ressource verfügbar
    console.error('Fetch failed:', error);
    throw error;
  }
}

// Netzwerk-First-Strategie für API und allgemeine Anfragen
async function networkFirstStrategy(request) {
  try {
    // Versuchen, vom Netzwerk zu holen
    const networkResponse = await fetch(request);
    
    // API-Antworten im Cache speichern
    if (networkResponse.ok && request.url.includes('/api/')) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network request failed, trying cache:', request.url);
    
    // Vom Netzwerk fehlgeschlagen, aus dem Cache versuchen
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Wenn HTML angefordert wird, Offline-Seite anzeigen
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    // Keine Fallback-Ressource verfügbar
    console.error('Fetch failed and no cache available:', error);
    throw error;
  }
}

// Cache im Hintergrund aktualisieren
async function updateCache(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse);
    }
  } catch (error) {
    console.log('Background cache update failed:', error);
  }
}

// Hilfsfunktionen
function isImageRequest(request) {
  return request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) || 
         request.headers.get('Accept').includes('image/');
}

function isStaticAsset(pathname) {
  return pathname.match(/\.(css|js|woff2?|ttf|eot)$/i) || 
         STATIC_ASSETS.includes(pathname);
}

// Periodische Synchronisierung für Offline-Daten
self.addEventListener('periodicsync', event => {
  if (event.tag === 'sync-dashboard-data') {
    event.waitUntil(syncDashboardData());
  }
});

// Dashboard-Daten synchronisieren
async function syncDashboardData() {
  try {
    const apiEndpoints = [
      '/dashboard/api/dashboard-stats',
      '/dashboard/appointments/api/events'
    ];
    
    const promises = apiEndpoints.map(async endpoint => {
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        await cache.put(endpoint, response);
      }
    });
    
    await Promise.all(promises);
    console.log('Dashboard data synchronized successfully');
  } catch (error) {
    console.error('Failed to sync dashboard data:', error);
  }
}