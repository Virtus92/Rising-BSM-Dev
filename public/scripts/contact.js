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
  })()
  
  // Asynchrones Absenden des Kontaktformulars
  // Asynchrones Absenden des Kontaktformulars
  // Optimierte Formularverarbeitung mit verbesserten Funktionen
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    // Echtzeit-Validierung der E-Mail
    const emailInput = document.getElementById('emailInput');
    if (emailInput) {
      emailInput.addEventListener('blur', function() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.value && !emailRegex.test(this.value)) {
          this.classList.add('is-invalid');
        } else if (this.value) {
          this.classList.remove('is-invalid');
          this.classList.add('is-valid');
        }
      });
    }
  
    // Erweiterte Formularverarbeitung
    contactForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Scrollposition merken
      const scrollPosition = window.scrollY;
      
      // Feedback-Element vorbereiten
      const feedbackEl = document.getElementById('formFeedback');
      feedbackEl.innerHTML = '';
      
      // Formular-Status zurücksetzen
      this.classList.remove('was-validated');
      
      // Formular-Eingabefelder deaktivieren während der Übermittlung
      const formElements = this.querySelectorAll('input, textarea, select, button');
      formElements.forEach(element => {
        element.disabled = true;
      });
      
      // Formular-Daten sammeln
      const formData = {
        name: this.querySelector('[name="name"]').value.trim(),
        email: this.querySelector('[name="email"]').value.trim(),
        phone: this.querySelector('[name="phone"]').value.trim(),
        service: this.querySelector('[name="service"]').value,
        message: this.querySelector('[name="message"]').value.trim(),
        timestamp: new Date().toISOString() // Zeitstempel hinzufügen
      };
      
      // Client-seitige Validierung
      let errors = [];
      if (!formData.name) errors.push('Name ist ein Pflichtfeld.');
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) {
        errors.push('E-Mail ist ein Pflichtfeld.');
      } else if (!emailRegex.test(formData.email)) {
        errors.push('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      }
      
      if (!formData.message) errors.push('Nachricht ist ein Pflichtfeld.');
      
      // Datenschutz-Checkbox prüfen
      const privacyCheck = document.getElementById('privacyCheck');
      if (!privacyCheck.checked) {
        errors.push('Sie müssen den Datenschutzhinweis akzeptieren.');
      }
      
      // Bei Validierungsfehlern abbrechen
      if (errors.length > 0) {
        const errorHtml = errors.map(error => `<div>${error}</div>`).join('');
        feedbackEl.innerHTML = `<div class="alert alert-danger mt-3" role="alert">
          <i class="fas fa-exclamation-circle me-2"></i>${errorHtml}
        </div>`;
        
        // Formular-Eingabefelder wieder aktivieren
        formElements.forEach(element => {
          element.disabled = false;
        });
        
        return;
      }
      
      // Lade-Animation anzeigen
      feedbackEl.innerHTML = `<div class="alert alert-info mt-3" role="alert">
        <div class="d-flex align-items-center">
          <div class="spinner-border spinner-border-sm me-2" role="status">
            <span class="visually-hidden">Wird gesendet...</span>
          </div>
          <div>Ihre Nachricht wird gesendet...</div>
        </div>
      </div>`;
      
      // Formular-Daten senden mit Wiederholungslogik
      sendFormData(formData);
      
      // Hilfsfunktion zum Senden der Daten mit Wiederholungslogik
      function sendFormData(data, retryCount = 0) {
        fetch('/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(response => {
          if (!response.ok) {
            // Server-Antwort nicht OK
            if (response.status === 429 && retryCount < 2) {
              // Rate-Limiting - erneut versuchen nach kurzer Verzögerung
              setTimeout(() => {
                sendFormData(data, retryCount + 1);
              }, 1000 * (retryCount + 1));
              return Promise.reject(new Error('Server überlastet. Erneuter Versuch...'));
            }
            return response.json().then(errorData => {
              throw new Error(errorData.error || `Fehler ${response.status}: ${response.statusText}`);
            });
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            // Erfolgreiche Übermittlung
            feedbackEl.innerHTML = `<div class="alert alert-success mt-3" role="alert">
              <div class="d-flex">
                <div class="me-3">
                  <i class="fas fa-check-circle fa-2x"></i>
                </div>
                <div>
                  <h5 class="alert-heading">Vielen Dank für Ihre Nachricht!</h5>
                  <p class="mb-0">Wir haben Ihre Anfrage erhalten und werden uns in Kürze bei Ihnen melden.</p>
                </div>
              </div>
            </div>`;
            
            // Formular zurücksetzen
            contactForm.reset();
            
            // Lokale Speicherung für Teilausfüllung beim nächsten Besuch
            localStorage.removeItem('partialFormData');
            
            // Erfolgreich-Animation zeigen
            animateSuccess();
          } else {
            throw new Error(data.error || 'Ein unbekannter Fehler ist aufgetreten.');
          }
        })
        .catch(error => {
          console.error('Fehler:', error);
          
          // Fehlermeldung anzeigen
          feedbackEl.innerHTML = `<div class="alert alert-danger mt-3" role="alert">
            <div class="d-flex">
              <div class="me-3">
                <i class="fas fa-exclamation-triangle fa-2x"></i>
              </div>
              <div>
                <h5 class="alert-heading">Fehler bei der Übermittlung</h5>
                <p class="mb-0">${error.message || 'Bitte versuchen Sie es später erneut.'}</p>
                <button class="btn btn-sm btn-outline-danger mt-2 retry-button">Erneut versuchen</button>
              </div>
            </div>
          </div>`;
          
          // Event-Listener für erneuten Versuch
          const retryButton = feedbackEl.querySelector('.retry-button');
          if (retryButton) {
            retryButton.addEventListener('click', function() {
              sendFormData(data);
            });
          }
          
          // Teilausfüllung im lokalen Speicher sichern
          savePartialFormData(data);
        })
        .finally(() => {
          // Formular-Felder wieder aktivieren
          formElements.forEach(element => {
            element.disabled = false;
          });
          
          // Wieder zur Formular-Position scrollen
          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        });
      }
      
      // Hilfsfunktion für Erfolgs-Animation
      function animateSuccess() {
        // Sanftes Scrollen zum Feedback-Element
        feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Hilfsfunktion zum Speichern von Teildaten
      function savePartialFormData(data) {
        // Entferne sensible Daten
        const { message, timestamp, ...partialData } = data;
        
        // Speichern im localStorage (wird beim Erfolg gelöscht)
        localStorage.setItem('partialFormData', JSON.stringify(partialData));
      }
    });
    
    // Teilausfüllung aus lokalem Speicher wiederherstellen
    function restorePartialFormData() {
      const savedData = localStorage.getItem('partialFormData');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          
          // Felder ausfüllen, wenn sie existieren
          if (data.name) contactForm.querySelector('[name="name"]').value = data.name;
          if (data.email) contactForm.querySelector('[name="email"]').value = data.email;
          if (data.phone) contactForm.querySelector('[name="phone"]').value = data.phone;
          if (data.service) {
            const serviceSelect = contactForm.querySelector('[name="service"]');
            if (serviceSelect) serviceSelect.value = data.service;
          }
          
          console.log('Formular-Teildaten wiederhergestellt');
        } catch (e) {
          console.error('Fehler beim Wiederherstellen der Formular-Teildaten', e);
          // Bei Fehler lokalen Speicher löschen
          localStorage.removeItem('partialFormData');
        }
      }
    }
    
    // Beim Laden der Seite versuchen, Teildaten wiederherzustellen
    restorePartialFormData();
  }