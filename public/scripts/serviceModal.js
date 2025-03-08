function initModals() {
    // Globale Modal-Schließen-Funktion
    window.closeModal = function() {
      const modals = document.querySelectorAll('.modal');
      modals.forEach(modalEl => {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      });
    };
    
    // Service-Modal-Funktionen
    window.openModal = function(title, subtitle, headerImage, content) {
      const modalElement = document.getElementById('serviceModal');
      if (!modalElement) return;
      
      document.getElementById('serviceModalLabel').textContent = title;
      document.getElementById('serviceModalSubtitle').textContent = subtitle;
      
      const headerBg = document.getElementById('modalHeaderBg');
      headerBg.style.backgroundImage = `url('${headerImage}')`;
      
      document.getElementById('serviceModalBody').innerHTML = content;
      
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    };
    
    // Event-Listener für Modals, um sie zu bereinigen, wenn sie geschlossen werden
    const serviceModal = document.getElementById('serviceModal');
    if (serviceModal) {
      serviceModal.addEventListener('hidden.bs.modal', function() {
        const body = document.getElementById('serviceModalBody');
        if (body) body.innerHTML = '';
      });
    }
  }
  initModals();
  
const ServiceModals = {
    // Spezifische Funktion für Facility Management
    openFacilityModal() {
      const title = "Facility Management";
      const subtitle = "Professionelle Betreuung Ihrer Immobilie";
      const headerImage = "images/facility2.jpg";
      
      const content = `
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
        </div>
      `;
      
      openModal(title, subtitle, headerImage, content);
    },
    
    // Spezifische Funktion für Umzüge
    openUmzugModal() {
      const title = "Umzüge & Transporte";
      const subtitle = "Stressfrei von A nach B";
      const headerImage = "images/transport.jpg";
      
      const content = `
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
        </div>
      `;
      
      openModal(title, subtitle, headerImage, content);
    },
    
    // Spezifische Funktion für Winterdienst
    openWinterModal() {
      const title = "Sommer- & Winterdienst";
      const subtitle = "Ganzjährige Betreuung Ihrer Außenanlagen";
      const headerImage = "images/Path.webp";
      
      const content = `
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
        </div>
      `;
      
      openModal(title, subtitle, headerImage, content);
    }
    };