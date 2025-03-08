document.addEventListener("DOMContentLoaded", function() {
  "use strict";

  window.ServiceModals = {};

  // Am Anfang des Dokuments (nach "use strict";)
  window.closeModal = function() {
    const modalElement = document.getElementById('serviceModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    }
  };
  
  // Utility Functions
  function currentYear() {
    document.querySelectorAll('#currentYear').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }
  
  // Navbar Scroll Handling - Vereinfacht mit Bootstrap-Klassen
  function handleNavbarScroll() {
    const navbar = document.getElementById("mainNav");
    if (!navbar) return;
    
    window.addEventListener("scroll", function() {
      if (window.scrollY > 80) {
        navbar.classList.add("bg-white", "shadow-sm");
      } else {
        navbar.classList.remove("shadow-sm");
        if (window.scrollY <= 10) {
          navbar.classList.add("bg-white");
        }
      }
    });
  }
  
  // Optimierte Hero-Slideshow
  function initHeroSlideshow() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;
    
    let currentSlide = 0;
    const slideInterval = 5000;
    
    function goToSlide(index) {
      slides.forEach(slide => slide.classList.remove('active'));
      currentSlide = (index + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
    }
    
    setInterval(() => goToSlide(currentSlide + 1), slideInterval);
  }
  
  // Bootstrap-basierte Modal-Funktionen mit data-Attributen
  function initServiceModals() {

    document.querySelectorAll('.modal-trigger').forEach(trigger => {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        const modalType = this.dataset.modal;
        if (modalType === 'facility') {
          ServiceModals.openFacilityModal();
        } else if (modalType === 'moving') {
          ServiceModals.openUmzugModal();
        } else if (modalType === 'winter') {
          ServiceModals.openWinterModal();
        }
      });
    });
    // Service-Modal-Handler
    document.addEventListener('click', function(e) {
      const modalTrigger = e.target.closest('[data-modal-trigger]');
      if (!modalTrigger) return;
      
      const modalType = modalTrigger.dataset.modalTrigger;
      const modalData = {
        facility: {
          title: "Facility Management",
          subtitle: "Professionelle Betreuung Ihrer Immobilie",
          headerImage: "images/facility2.jpg",
          content: `
        <div class="row g-4">
          <div class="col-lg-6">
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-building text-success me-2"></i>Komplette Hausbetreuung</h4>
              <p class="text-muted">Von der regelmäßigen Reinigung bis zur technischen Wartung kümmern wir uns um alle Aspekte Ihrer Immobilie.</p>
            </div>
            
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-leaf text-success me-2"></i>Grünflächenpflege</h4>
              <p class="text-muted">Unsere Experten halten Ihre Außenanlagen gepflegt und attraktiv, was den Wert Ihrer Immobilie steigert.</p>
            </div>
          </div>
          
          <div class="col-lg-6">
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-broom text-success me-2"></i>Reinigungsservice</h4>
              <p class="text-muted">Wir sorgen für Sauberkeit und Funktionalität, damit Sie sich auf Ihr Kerngeschäft konzentrieren können.</p>
            </div>
            
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-tools text-success me-2"></i>Instandhaltung</h4>
              <p class="text-muted">Regelmäßige Wartung und schnelle Reparaturen halten Ihre Immobilie in Top-Zustand.</p>
            </div>
          </div>
        </div>
        
        <div class="bg-light p-4 rounded-3 mt-3">
          <div class="d-flex align-items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-lightbulb text-warning fa-2x"></i>
            </div>
            <div class="flex-grow-1 ms-3">
              <h4 class="h5 mb-1">Ihr Vorteil</h4>
              <p class="mb-0">Mit unserem Service sparen Sie Zeit und Ressourcen, während wir die Effizienz und den Wert Ihrer Immobilie erhöhen.</p>
            </div>
          </div>
        </div>
        
        <div class="mt-4 text-center">
          <button class="btn btn-success btn-lg" onclick="startAIBeratung()">
            <i class="fas fa-robot me-2"></i>Kostenlose AI-Beratung starten
          </button>
        </div>`
        },
        moving: {
          title: "Umzüge & Transporte",
          subtitle: "Stressfrei von A nach B",
          headerImage: "images/transport.jpg",
          content: `
        <div class="row g-4">
          <div class="col-lg-6">
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-home text-success me-2"></i>Privat- & Firmenumzüge</h4>
              <p class="text-muted">Ob kleines Apartment oder großes Büro, wir planen und führen Ihren Umzug professionell durch.</p>
            </div>
            
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-couch text-success me-2"></i>Möbel- & Spezialtransporte</h4>
              <p class="text-muted">Wir transportieren Ihre wertvollen oder empfindlichen Gegenstände sicher und zuverlässig.</p>
            </div>
          </div>
          
          <div class="col-lg-6">
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-truck-loading text-success me-2"></i>Logistik & Planung</h4>
              <p class="text-muted">Wir übernehmen die gesamte Organisation und sorgen für einen reibungslosen Ablauf.</p>
            </div>
            
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-shipping-fast text-success me-2"></i>Express- & Langstrecken</h4>
              <p class="text-muted">Egal, ob es schnell gehen muss oder über weite Distanzen, wir sind Ihr verlässlicher Partner.</p>
            </div>
          </div>
        </div>
        
        <div class="bg-light p-4 rounded-3 mt-3">
          <div class="d-flex align-items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-lightbulb text-warning fa-2x"></i>
            </div>
            <div class="flex-grow-1 ms-3">
              <h4 class="h5 mb-1">Ihr Vorteil</h4>
              <p class="mb-0">Unsere Expertise garantiert einen reibungslosen Ablauf, sodass Sie sich entspannt zurücklehnen können.</p>
            </div>
          </div>
        </div>
        
        <div class="mt-4 text-center">
          <button class="btn btn-success btn-lg" onclick="startAIBeratung()">
            <i class="fas fa-robot me-2"></i>Kostenlose AI-Beratung starten
          </button>
        </div>`
        },
        winter: {
          title: "Sommer- & Winterdienst",
          subtitle: "Ganzjährige Betreuung Ihrer Außenanlagen",
          headerImage: "images/Path.webp",
          content: `
        <div class="row g-4">
          <div class="col-lg-6">
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-seedling text-success me-2"></i>Rasenpflege & Baumschnitt</h4>
              <p class="text-muted">Im Sommer halten wir Ihre Grünflächen in Bestform und kümmern uns um professionellen Baumschnitt.</p>
            </div>
            
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-snowflake text-success me-2"></i>Schnee- & Eisräumung</h4>
              <p class="text-muted">Im Winter gewährleisten wir sichere Wege und Zufahrten mit zuverlässiger Schnee- und Eisräumung.</p>
            </div>
          </div>
          
          <div class="col-lg-6">
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-shield-alt text-success me-2"></i>Streudienst & Prävention</h4>
              <p class="text-muted">Wir treffen Vorsorge, damit Sie sich keine Sorgen um Glätte und Unfallgefahren machen müssen.</p>
            </div>
            
            <div class="mb-4">
              <h4 class="h5 mb-3"><i class="fas fa-calendar-alt text-success me-2"></i>Ganzjährige Planung</h4>
              <p class="text-muted">Mit unserem Service sind Sie zu jeder Jahreszeit vorbereitet und müssen sich um nichts kümmern.</p>
            </div>
          </div>
        </div>
        
        <div class="bg-light p-4 rounded-3 mt-3">
          <div class="d-flex align-items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-lightbulb text-warning fa-2x"></i>
            </div>
            <div class="flex-grow-1 ms-3">
              <h4 class="h5 mb-1">Ihr Vorteil</h4>
              <p class="mb-0">Mit unserem ganzjährigen Service erhöhen Sie die Sicherheit und Attraktivität Ihrer Immobilie.</p>
            </div>
          </div>
        </div>
        
        <div class="mt-4 text-center">
          <button class="btn btn-success btn-lg" onclick="startAIBeratung()">
            <i class="fas fa-robot me-2"></i>Kostenlose AI-Beratung starten
          </button>
        </div>`
        }
      };

      window.ServiceModals = {
        openFacilityModal: function() {
          const data = modalData.facility;
          document.getElementById('serviceModalLabel').textContent = data.title;
          document.getElementById('serviceModalSubtitle').textContent = data.subtitle;
          document.getElementById('modalHeaderBg').style.backgroundImage = `url('${data.headerImage}')`;
          document.getElementById('serviceModalBody').innerHTML = data.content;
          const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
          modal.show();
        },
        openUmzugModal: function() {
          const data = modalData.moving;
          document.getElementById('serviceModalLabel').textContent = data.title;
          document.getElementById('serviceModalSubtitle').textContent = data.subtitle;
          document.getElementById('modalHeaderBg').style.backgroundImage = `url('${data.headerImage}')`;
          document.getElementById('serviceModalBody').innerHTML = data.content;
          const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
          modal.show();
        },
        openWinterModal: function() {
          const data = modalData.winter;
          document.getElementById('serviceModalLabel').textContent = data.title;
          document.getElementById('serviceModalSubtitle').textContent = data.subtitle;
          document.getElementById('modalHeaderBg').style.backgroundImage = `url('${data.headerImage}')`;
          document.getElementById('serviceModalBody').innerHTML = data.content;
          const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
          modal.show();
        }
      };
      
      const data = modalData[modalType];
      if (!data) return;
      
      document.getElementById('serviceModalLabel').textContent = data.title;
      document.getElementById('serviceModalSubtitle').textContent = data.subtitle;
      document.getElementById('modalHeaderBg').style.backgroundImage = `url('${data.headerImage}')`;
      document.getElementById('serviceModalBody').innerHTML = data.content;
    });
  }


  // Am Anfang des Dokuments (nach "use strict";)
window.startAIBeratung = function() {
  alert('AI-Beratung wird geladen...');
  // Hier Ihre tatsächliche Implementierung
};
  
  // Cookie-Banner-Funktionalität (vereinfacht)
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
      cookieBanner.classList.add('hiding');

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
  
  // Formularvalidierung mit Bootstrap
  function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;
    
    // Bootstrap-Validierungsfunktionalität verwenden
    contactForm.addEventListener('submit', function(event) {
      if (!this.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        event.preventDefault();
        submitFormWithAjax(this);
      }
      
      this.classList.add('was-validated');
    });
    
    function submitFormWithAjax(form) {
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => data[key] = value);
      
      // Feedback-Element
      const feedbackEl = document.getElementById('formFeedback');
      feedbackEl.innerHTML = `<div class="alert alert-info">Nachricht wird gesendet...</div>`;
      
      fetch('/contact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          feedbackEl.innerHTML = `<div class="alert alert-success">Vielen Dank für Ihre Nachricht!</div>`;
          form.reset();
        } else {
          throw new Error(data.error || 'Ein Fehler ist aufgetreten');
        }
      })
      .catch(error => {
        feedbackEl.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
      });
    }
  }
  
  // Initialisierung aller Funktionen
  currentYear();
  handleNavbarScroll();
  initHeroSlideshow();
  initServiceModals();
  initCookieConsent();
  initContactForm();
});