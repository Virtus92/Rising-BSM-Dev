/**
 * PWA Service Worker Registrierung
 * In public/scripts/pwa.js speichern
 */

// Service Worker nur registrieren, wenn er vom Browser unterstützt wird
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          // console.log('Service Worker registered successfully:', registration.scope);
          
          // Nach Updates checken
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            // console.log('Service Worker update found!');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateNotification();
              }
            });
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
      
      // Auf Offline-Status reagieren
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      updateOnlineStatus();
      
      // Hintergrund-Synchronisierung registrieren, wenn verfügbar
      if ('periodicSync' in registration) {
        // Erlaubnis prüfen
        navigator.permissions.query({
          name: 'periodic-background-sync',
        }).then(status => {
          if (status.state === 'granted') {
            registration.periodicSync.register('sync-dashboard-data', {
              minInterval: 60 * 60 * 1000, // 1 Stunde
            });
          }
        });
      }
    });
  }
  
  // Update-Benachrichtigung anzeigen
  function showUpdateNotification() {
    // Nur anzeigen, wenn nicht bereits vorhanden
    if (document.querySelector('.update-toast')) {
      return;
    }
    
    const toast = document.createElement('div');
    toast.className = 'update-toast';
    toast.innerHTML = `
      <div class="toast-header">
        <strong class="me-auto">Update verfügbar</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">
        <p>Eine neue Version ist verfügbar.</p>
        <button class="btn btn-primary btn-sm refresh-btn">Jetzt aktualisieren</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Bootstrap Toast initialisieren
    if (typeof bootstrap !== 'undefined') {
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
    }
    
    // Event-Listener für Aktualisieren-Button
    toast.querySelector('.refresh-btn').addEventListener('click', () => {
      window.location.reload();
    });
  }
  
  // Online-Status aktualisieren
  function updateOnlineStatus() {
    const statusIndicator = document.getElementById('onlineStatusIndicator');
    
    if (!statusIndicator) {
      // Indikator erstellen, wenn nicht vorhanden
      const indicator = document.createElement('div');
      indicator.id = 'onlineStatusIndicator';
      indicator.className = navigator.onLine ? 'online' : 'offline';
      
      // Stil hinzufügen
      const style = document.createElement('style');
      style.textContent = `
        #onlineStatusIndicator {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 9999;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
          opacity: 0;
          transform: translateY(10px);
        }
        
        #onlineStatusIndicator.show {
          opacity: 1;
          transform: translateY(0);
        }
        
        #onlineStatusIndicator.online {
          background-color: #198754;
          color: white;
        }
        
        #onlineStatusIndicator.offline {
          background-color: #dc3545;
          color: white;
        }
        
        #onlineStatusIndicator.online::before {
          content: '\\f1eb';
          font-family: 'Font Awesome 6 Free';
          font-weight: 900;
        }
        
        #onlineStatusIndicator.offline::before {
          content: '\\f1eb';
          font-family: 'Font Awesome 6 Free';
          font-weight: 900;
        }
        
        @media (max-width: 576px) {
          #onlineStatusIndicator {
            bottom: 70px;
          }
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(indicator);
      
      // Text setzen
      indicator.textContent = navigator.onLine ? 'Online' : 'Offline';
      
      // Kurz anzeigen
      setTimeout(() => {
        indicator.classList.add('show');
        
        setTimeout(() => {
          indicator.classList.remove('show');
        }, 3000);
      }, 100);
    } else {
      // Vorhandenen Indikator aktualisieren
      statusIndicator.className = navigator.onLine ? 'online show' : 'offline show';
      statusIndicator.textContent = navigator.onLine ? 'Online' : 'Offline';
      
      // Nach kurzer Zeit ausblenden
      setTimeout(() => {
        statusIndicator.classList.remove('show');
      }, 3000);
    }
  }
  
  // Für PWA: Von Home-Screen installierbare App
  window.addEventListener('beforeinstallprompt', (e) => {
    // Standardverhalten verhindern
    e.preventDefault();
    
    // Prompt speichern
    const deferredPrompt = e;
    
    // Install-Button anzeigen, falls vorhanden
    const installButton = document.getElementById('installPwaButton');
    
    if (installButton) {
      installButton.style.display = 'block';
      
      installButton.addEventListener('click', () => {
        // Installation anzeigen
        deferredPrompt.prompt();
        
        // Auf Antwort des Benutzers warten
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            // console.log('User accepted the install prompt');
            // Button ausblenden
            installButton.style.display = 'none';
          } else {
            // console.log('User dismissed the install prompt');
          }
        });
      });
    }
  });
  
  // Wenn die App fertig installiert ist
  window.addEventListener('appinstalled', (event) => {
    // console.log('App was installed', event);
    // Verstecke den Install-Button nach erfolgreicher Installation
    if (installButton) {
      installButton.style.display = 'none';
    }
  });