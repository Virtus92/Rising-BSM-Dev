function initCookieConsent() {
    const cookieBanner = document.getElementById('cookieConsentBanner');
    if (!cookieBanner) return;
    
    const detailsToggle = document.getElementById('cookieDetailsToggle');
    const detailsSection = document.getElementById('cookieDetails');
    const acceptAllButton = document.getElementById('acceptAllCookies');
    const acceptSelectedButton = document.getElementById('acceptSelectedCookies');
    const rejectAllButton = document.getElementById('rejectAllCookies');
    const analyticsCookiesCheckbox = document.getElementById('analyticsCookies');
    const chatbotCookiesCheckbox = document.getElementById('chatbotCookies');
    
    // Effizientere Cookie-Parsing Funktion
    function getCookie(name) {
      const cookieString = document.cookie;
      const cookies = cookieString.split(';');
      
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          return cookie.substring(name.length + 1);
        }
      }
      return null;
    }
    
    // Cookie-Banner anzeigen, wenn keine Präferenzen gesetzt wurden
    if (!getCookie('cookieConsent')) {
      cookieBanner.style.display = 'block';
    }
    
    // Toggle für Cookie-Details mit verbesserten Animationen
    if (detailsToggle && detailsSection) {
      detailsToggle.addEventListener('click', function() {
        const isHidden = detailsSection.style.display === 'none' || !detailsSection.style.display;
        
        if (isHidden) {
          detailsSection.style.display = 'block';
          detailsSection.style.maxHeight = '0';
          
          // Trigger reflow
          detailsSection.offsetHeight;
          
          detailsSection.style.transition = 'max-height 0.3s ease-in-out';
          detailsSection.style.maxHeight = detailsSection.scrollHeight + 'px';
          detailsToggle.textContent = 'Details ausblenden';
        } else {
          detailsSection.style.maxHeight = '0';
          detailsToggle.textContent = 'Details anzeigen';
          
          // Nach der Animation ausblenden
          setTimeout(() => {
            detailsSection.style.display = 'none';
          }, 300);
        }
      });
    }
    
    // Verbesserte Cookie-Präferenz-Speicherung
    function setCookiePreferences(preferences) {
      // Validieren der Präferenzen
      const validPreferences = {
        necessary: true, // Immer notwendig
        analytics: Boolean(preferences.analytics),
        chatbot: Boolean(preferences.chatbot)
      };
      
      // JSON.stringify kann Performance-Probleme verursachen
      // Stattdessen direktes String-Format für das Cookie
      const preferencesStr = [
        `necessary=${validPreferences.necessary}`,
        `analytics=${validPreferences.analytics}`,
        `chatbot=${validPreferences.chatbot}`
      ].join('&');
      
      // Cookie für 6 Monate setzen
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      
      // Cookie mit Präferenzen speichern
      document.cookie = `cookieConsent=${encodeURIComponent(preferencesStr)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
      
      // Präferenzen anwenden
      applyPreferences(validPreferences);
      
      // Banner ausblenden mit Übergang
      cookieBanner.style.opacity = '0';
      cookieBanner.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        cookieBanner.style.display = 'none';
      }, 300);
    }
    
    // Cookie-Button-Event-Listener
    if (acceptAllButton) {
      acceptAllButton.addEventListener('click', function() {
        setCookiePreferences({
          necessary: true,
          analytics: true,
          chatbot: true
        });
      });
    }
    
    if (acceptSelectedButton) {
      acceptSelectedButton.addEventListener('click', function() {
        setCookiePreferences({
          necessary: true,
          analytics: analyticsCookiesCheckbox && analyticsCookiesCheckbox.checked,
          chatbot: chatbotCookiesCheckbox && chatbotCookiesCheckbox.checked
        });
      });
    }
    
    if (rejectAllButton) {
      rejectAllButton.addEventListener('click', function() {
        setCookiePreferences({
          necessary: true,
          analytics: false,
          chatbot: false
        });
      });
    }
    
    // Präferenzen anwenden
    function applyPreferences(preferences) {
      console.log('Angewandte Cookie-Präferenzen:', preferences);
      
      // Analytics aktivieren/deaktivieren
      if (preferences.analytics) {
        loadAnalytics();
      }
      
      // Chatbot aktivieren/deaktivieren
      if (preferences.chatbot) {
        loadChatbot();
      }
    }
    
    // Bestehende Präferenzen laden, wenn vorhanden
    const savedConsent = getCookie('cookieConsent');
    if (savedConsent) {
      try {
        // Parsen des Cookie-Formats "necessary=true&analytics=false&chatbot=true"
        const preferencePairs = decodeURIComponent(savedConsent).split('&');
        const preferences = {};
        
        preferencePairs.forEach(pair => {
          const [key, value] = pair.split('=');
          preferences[key] = value === 'true';
        });
        
        // Checkboxen entsprechend setzen
        if (analyticsCookiesCheckbox) analyticsCookiesCheckbox.checked = preferences.analytics || false;
        if (chatbotCookiesCheckbox) chatbotCookiesCheckbox.checked = preferences.chatbot || false;
        
        // Präferenzen anwenden
        applyPreferences(preferences);
      } catch (e) {
        console.error('Fehler beim Parsen der Cookie-Präferenzen:', e);
      }
    }
    
    // Platzhalter-Funktionen für Analytics und Chatbot
    function loadAnalytics() {
      // Hier den Analytics-Code laden
      console.log('Analytics würde hier geladen werden');
    }
    
    function loadChatbot() {
      // Hier den Chatbot-Code laden
      console.log('Chatbot würde hier geladen werden');
    }
  }
  initCookieConsent();