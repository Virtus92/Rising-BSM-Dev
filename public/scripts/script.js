document.addEventListener("DOMContentLoaded", function() {
  "use strict";

  // CSRF-Token für alle Fetch-Anfragen automatisch einrichten
  const setupCSRF = () => {
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
      const csrfToken = csrfMeta.getAttribute('content');
      
      // Originale fetch()-Funktion sichern
      const originalFetch = window.fetch;
      
      // fetch() überschreiben, um CSRF-Token hinzuzufügen
      window.fetch = function(url, options = {}) {
        // Wenn es sich um eine POST/PUT/DELETE-Anfrage handelt
        if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
          // Headers vorbereiten
          options.headers = options.headers || {};
          
          // CSRF-Token in Header setzen
          options.headers['CSRF-Token'] = csrfToken;
        }
        
        // Resolve relative URLs
        const absoluteUrl = url.startsWith('http') ? url : new URL(url, window.location.origin).href;
        
        return originalFetch.call(this, absoluteUrl, options);
      };
      
      console.log('CSRF-Schutz für AJAX-Anfragen konfiguriert');
    } else {
      console.warn('CSRF-Meta-Tag nicht gefunden!');
    }
  };
  
  // CSRF-Setup ausführen
  setupCSRF();

  window.ServiceModals = {};

  // Utility Functions
  const currentYear = () => {
    document.querySelectorAll('#currentYear').forEach(el => el.textContent = new Date().getFullYear());
  };

  const initHeroSlideshow = () => {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;

    let currentSlide = 0;
    setInterval(() => {
      slides.forEach(slide => slide.classList.remove('active'));
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 5000);
  };

  const initServiceModals = () => {
    const modalData = {
      facility: {
        title: "Facility Management",
        subtitle: "Professionelle Betreuung Ihrer Immobilie",
        headerImage: "images/facility2.jpg",
        content: `
          <div class="row g-4">
            <div class="col-lg-6">
              <div class="mb-4">
                <h4 class="h5 mb-3"><i class="fas fa-leaf text-success me-2"></i>Grünflächenbetreuung</h4>
                <p class="text-muted">Professionelle Pflege und Instandhaltung Ihrer Außenanlagen, Parks und Grünflächen für einen perfekten ersten Eindruck.</p>
              </div>
              <div class="mb-4">
                <h4 class="h5 mb-3"><i class="fas fa-building text-success me-2"></i>Flächenbetreuung</h4>
                <p class="text-muted">Umfassende Betreuung für Wohngebäude, Wohnungen und Spielplätze mit regelmäßigen Kontrollen und Wartungen.</p>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="mb-4">
                <h4 class="h5 mb-3"><i class="fas fa-broom text-success me-2"></i>Stiegenreinigung</h4>
                <p class="text-muted">Regelmäßige und gründliche Reinigung von Treppenhäusern und Gemeinschaftsbereichen in Wohn- und Geschäftsgebäuden.</p>
              </div>
              <div class="mb-4">
                <h4 class="h5 mb-3"><i class="fas fa-tools text-success me-2"></i>Instandhaltung</h4>
                <p class="text-muted">Regelmäßige Wartung und schnelle Reparaturen halten Ihre Immobilie in Top-Zustand und verlängern deren Lebensdauer.</p>
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
                <p class="mb-0">Mit unseren Facility Management Lösungen sparen Sie Zeit und Ressourcen, während wir die Effizienz und den Wert Ihrer Immobilie steigern.</p>
              </div>
            </div>
          </div>
          <div class="mt-4 text-center">
            <button class="btn btn-success btn-lg" onclick="startAIBeratung()">
              <i class="fas fa-robot me-2"></i>Kostenlose AI-Beratung starten
            </button>
          </div>`
      },
      objektbetreuung: {
        title: "Objektbetreuung & Hausmeisterdienste",
        subtitle: "Zuverlässige Betreuung für Ihre Immobilie",
        headerImage: "images/facility2.jpg",
        content: `
          <div class="row g-4">
            <div class="col-lg-6">
              <div class="mb-4">
                <h4 class="h5 mb-3"><i class="fas fa-search text-success me-2"></i>Regelmäßige Objektkontrolle</h4>
                <p class="text-muted">Wir führen regelmäßige Kontrollgänge durch und identifizieren potenzielle Probleme, bevor sie zu kostspieligen Schäden führen können.</p>
              </div>
              <div class="mb-4">
                <h4 class="h5 mb-3"><i class="fas fa-hammer text-success me-2"></i>Hausmeistertätigkeiten</h4>
                <p class="text-muted">Von der Glühbirne bis zum Wasserhahn – wir übernehmen alle alltäglichen Hausmeistertätigkeiten und sorgen für ein funktionierendes Gebäude.</p>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="mb-4">
                <h4 class="h5 mb-3"><i class="fas fa-phone-alt text-success me-2"></i>Handwerkerkoordination</h4>
                <p class="text-muted">Bei größeren Schäden oder spezialisierten Aufgaben koordinieren wir zuverlässige Handwerker und überwachen die fachgerechte Ausführung.</p>
              </div>
              <div class="mb-4">
                <h4 class="h5 mb-3"><i class="fas fa-key text-success me-2"></i>Schlüsselmanagement</h4>
                <p class="text-muted">Wir übernehmen das professionelle Schlüsselmanagement für Ihre Immobilie und garantieren höchste Sicherheit.</p>
              </div>
            </div>
          </div>
          <div class="bg-light p-4 rounded-3 mt-3">
            <div class="d-flex align-items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-lightbulb text-warning fa-2x"></i>
              </div>
              <div class="flex-grow-1 ms-3">
                <h4 class="h5 mb-1">Unser Betreuungsprozess</h4>
                <p class="mb-0">1. Erstbegehung und Bestandsaufnahme → 2. Individuelles Betreuungskonzept → 3. Regelmäßige Kontrollen → 4. Dokumentation und Reporting → 5. Kontinuierliche Optimierung</p>
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
      openFacilityModal: () => openModal('facility'),
      openObjektbetreuungModal: () => openModal('objektbetreuung'),
      openWinterModal: () => openModal('winter')
    };

    const openModal = (modalType) => {
      const data = modalData[modalType];
      if (!data) return;

      document.getElementById('serviceModalLabel').textContent = data.title;
      document.getElementById('serviceModalSubtitle').textContent = data.subtitle;
      document.getElementById('modalHeaderBg').style.backgroundImage = `url('${data.headerImage}')`;
      document.getElementById('serviceModalBody').innerHTML = data.content;

      const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
      modal.show();
    };

    document.querySelectorAll('.modal-trigger').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(trigger.dataset.modal);
      });
    });
  };

  window.startAIBeratung = () => {
    alert('AI-Beratung wird geladen...');
    // Hier Ihre tatsächliche Implementierung
  };

  const initCookieConsent = () => {
    const cookieBanner = document.getElementById('cookieConsentBanner');
    if (!cookieBanner) return;

    const detailsToggle = document.getElementById('cookieDetailsToggle');
    const detailsSection = document.getElementById('cookieDetails');
    const acceptAllButton = document.getElementById('acceptAllCookies');
    const acceptSelectedButton = document.getElementById('acceptSelectedCookies');
    const rejectAllButton = document.getElementById('rejectAllCookies');
    const analyticsCookiesCheckbox = document.getElementById('analyticsCookies');
    const chatbotCookiesCheckbox = document.getElementById('chatbotCookies');

    const getCookie = (name) => {
      const cookieString = document.cookie;
      const cookies = cookieString.split(';');

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          return cookie.substring(name.length + 1);
        }
      }
      return null;
    };

    if (!getCookie('cookieConsent')) {
      cookieBanner.style.display = 'block';
    }

    if (detailsToggle && detailsSection) {
      detailsToggle.addEventListener('click', () => {
        const isHidden = detailsSection.style.display === 'none' || !detailsSection.style.display;

        detailsSection.style.display = isHidden ? 'block' : 'none';
        detailsToggle.textContent = isHidden ? 'Details ausblenden' : 'Details anzeigen';
      });
    }

    const setCookiePreferences = (preferences) => {
      const validPreferences = {
        necessary: true,
        analytics: Boolean(preferences.analytics),
        chatbot: Boolean(preferences.chatbot)
      };

      const preferencesStr = `necessary=${validPreferences.necessary}&analytics=${validPreferences.analytics}&chatbot=${validPreferences.chatbot}`;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);

      document.cookie = `cookieConsent=${encodeURIComponent(preferencesStr)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
      applyPreferences(validPreferences);
      cookieBanner.classList.add('hiding');

      setTimeout(() => {
        cookieBanner.style.display = 'none';
      }, 300);
    };

    if (acceptAllButton) {
      acceptAllButton.addEventListener('click', () => setCookiePreferences({ analytics: true, chatbot: true }));
    }

    if (acceptSelectedButton) {
      acceptSelectedButton.addEventListener('click', () => setCookiePreferences({
        analytics: analyticsCookiesCheckbox && analyticsCookiesCheckbox.checked,
        chatbot: chatbotCookiesCheckbox && chatbotCookiesCheckbox.checked
      }));
    }

    if (rejectAllButton) {
      rejectAllButton.addEventListener('click', () => setCookiePreferences({ analytics: false, chatbot: false }));
    }

    const applyPreferences = (preferences) => {
      if (preferences.analytics) {
        console.log('Analytics würde hier geladen werden');
      }
      if (preferences.chatbot) {
        console.log('Chatbot würde hier geladen werden');
      }
    };

    const savedConsent = getCookie('cookieConsent');
    if (savedConsent) {
      try {
        const preferencePairs = decodeURIComponent(savedConsent).split('&');
        const preferences = {};

        preferencePairs.forEach(pair => {
          const [key, value] = pair.split('=');
          preferences[key] = value === 'true';
        });

        if (analyticsCookiesCheckbox) analyticsCookiesCheckbox.checked = preferences.analytics || false;
        if (chatbotCookiesCheckbox) chatbotCookiesCheckbox.checked = preferences.chatbot || false;

        applyPreferences(preferences);
      } catch (e) {
        console.error('Fehler beim Parsen der Cookie-Präferenzen:', e);
      }
    }
  };

  // Form Validation
  (() => {
    'use strict'
    const forms = document.querySelectorAll('.needs-validation')
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
        form.classList.add('was-validated')
      }, false)
    })
  })();

  const initContactForm = () => {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    // Email validation
    const emailInput = document.getElementById('emailInput');
    if (emailInput) {
      emailInput.addEventListener('blur', function() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.classList.toggle('is-invalid', this.value && !emailRegex.test(this.value));
        this.classList.toggle('is-valid', this.value && emailRegex.test(this.value));
      });
    }

    // Load partial form data on page load
    const loadSavedData = () => {
      const savedData = localStorage.getItem('partialFormData');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (data.name) contactForm.querySelector('[name="name"]').value = data.name;
          if (data.email) contactForm.querySelector('[name="email"]').value = data.email;
          if (data.phone) contactForm.querySelector('[name="phone"]').value = data.phone;
          if (data.service) contactForm.querySelector('[name="service"]').value = data.service;
          console.log('Formular-Teildaten wiederhergestellt');
        } catch (e) {
          console.error('Fehler beim Wiederherstellen der Formular-Teildaten:', e);
          localStorage.removeItem('partialFormData');
        }
      }
    };
    
    // Call this function when page loads
    loadSavedData();

    contactForm.addEventListener('submit', function(event) {
      event.preventDefault();

      const scrollPosition = window.scrollY;
      const feedbackEl = document.getElementById('formFeedback');
      feedbackEl.innerHTML = '';
      this.classList.remove('was-validated');

      // Get form elements
      const formElements = this.querySelectorAll('input, textarea, select, button');
      formElements.forEach(element => element.disabled = true);

      // Get CSRF token
      const csrfToken = this.querySelector('[name="_csrf"]').value;

      // Get form data
      const formData = {
        name: this.querySelector('[name="name"]').value.trim(),
        email: this.querySelector('[name="email"]').value.trim(),
        phone: this.querySelector('[name="phone"]').value.trim(),
        service: this.querySelector('[name="service"]').value,
        message: this.querySelector('[name="message"]').value.trim(),
        _csrf: csrfToken,
        timestamp: new Date().toISOString()
      };

      // Client-side validation
      let errors = [];
      if (!formData.name) errors.push('Name ist ein Pflichtfeld.');
      if (!formData.email) errors.push('E-Mail ist ein Pflichtfeld.');
      if (!formData.message) errors.push('Nachricht ist ein Pflichtfeld.');
      if (!document.getElementById('privacyCheck').checked) errors.push('Sie müssen den Datenschutzhinweis akzeptieren.');

      if (errors.length > 0) {
        feedbackEl.innerHTML = `<div class="alert alert-danger mt-3" role="alert"><i class="fas fa-exclamation-circle me-2"></i>${errors.map(error => `<div>${error}</div>`).join('')}</div>`;
        formElements.forEach(element => element.disabled = false);
        window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
        return;
      }

      feedbackEl.innerHTML = `<div class="alert alert-info mt-3" role="alert"><div class="d-flex align-items-center"><div class="spinner-border spinner-border-sm me-2" role="status"><span class="visually-hidden">Wird gesendet...</span></div><div>Ihre Nachricht wird gesendet...</div></div></div>`;

      // Use a relative path or explicit HTTP to avoid SSL errors locally
      const isLocalhost = window.location.hostname === 'localhost';
      const contactUrl = isLocalhost ? 'http://localhost:9295/contact' : '/contact';

      fetch(contactUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify(formData)
      })
      .then(response => {
        if (!response.ok) {
          console.error('Server response error:', response.status, response.statusText);
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .then(data => {
        if (data.includes('success')) {
          contactForm.reset();
          localStorage.removeItem('partialFormData');
        } else {
          throw new Error('Form submission failed');
        }
      })
      .catch(error => {
        console.error('Error submitting form:', error);
        feedbackEl.innerHTML = `<div class="alert alert-danger mt-3" role="alert"><div class="d-flex"><div class="me-3"><i class="fas fa-exclamation-triangle fa-2x"></i></div><div><h5 class="alert-heading">Fehler bei der Übermittlung</h5><p class="mb-0">Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.</p></div></div></div>`;
        
        // Save partial form data
        const { _csrf, ...partialData } = formData;
        localStorage.setItem('partialFormData', JSON.stringify(partialData));
      })
      .finally(() => {
        formElements.forEach(element => element.disabled = false);
        window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      });
    });
  };

  // Initialisierung aller Funktionen
  currentYear();
  initHeroSlideshow();
  initServiceModals();
  initCookieConsent();
  initContactForm();
});