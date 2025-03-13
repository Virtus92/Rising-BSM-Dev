
/**
 * Dashboard Core JavaScript
 * Optimized for performance and mobile support
 */
document.addEventListener("DOMContentLoaded", function() {
  "use strict";
  
  // DOM-Cache für oft verwendete Elemente
  const dashboardWrapper = document.querySelector('.dashboard-wrapper');
  const sidebarToggler = document.getElementById('sidebarToggle');
  const desktopSidebarToggle = document.querySelector('.desktop-sidebar-toggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarClose = document.getElementById('sidebarClose');

  // Performance-Optimierung: Debounce-Funktion für Event-Handler
  function debounce(func, wait, immediate) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  // Sidebar-Funktionalität
  function initSidebar() {
    if (sidebarToggler) {
      sidebarToggler.addEventListener('click', function() {
        dashboardWrapper.classList.toggle('sidebar-open');
        
        // Aria-Attribute für Barrierefreiheit
        const isOpen = dashboardWrapper.classList.contains('sidebar-open');
        this.setAttribute('aria-expanded', isOpen);

        // Overlay anzeigen/ausblenden
        if (sidebarOverlay) {
          sidebarOverlay.style.display = isOpen ? 'block' : 'none';
        }
      });
    }

    // Sidebar schließen über Button
    if (sidebarClose) {
      sidebarClose.addEventListener('click', function() {
        dashboardWrapper.classList.remove('sidebar-open');
        if (sidebarToggler) sidebarToggler.setAttribute('aria-expanded', 'false');
        if (sidebarOverlay) sidebarOverlay.style.display = 'none';
      });
    }
    
    // Desktop Sidebar-Toggle
    if (desktopSidebarToggle) {
      desktopSidebarToggle.addEventListener('click', function() {
        dashboardWrapper.classList.toggle('sidebar-closed');
        
        // Local Storage speichern, damit Einstellung erhalten bleibt
        const isClosed = dashboardWrapper.classList.contains('sidebar-closed');
        localStorage.setItem('sidebarClosed', isClosed);
      });
    }
    
    // Sidebar-Status aus localStorage abrufen
    const savedSidebarState = localStorage.getItem('sidebarClosed');
    if (savedSidebarState === 'true' && window.innerWidth >= 992) {
      dashboardWrapper.classList.add('sidebar-closed');
    }
    
    // Optimierte Version: Klick außerhalb der Sidebar auf mobilen Geräten
    // Mit Event-Delegation und nur wenn nötig
    document.addEventListener('click', function(event) {
      if (window.innerWidth < 992 && 
          dashboardWrapper.classList.contains('sidebar-open') && 
          !event.target.closest('.dashboard-sidebar') && 
          !event.target.closest('#sidebarToggle')) {
        dashboardWrapper.classList.remove('sidebar-open');
        if (sidebarToggler) sidebarToggler.setAttribute('aria-expanded', 'false');
        if (sidebarOverlay) sidebarOverlay.style.display = 'none';
      }
    });
  }

  // Optimierte DataTables-Initialisierung
  function initDataTables() {
    if (typeof $.fn !== 'undefined' && typeof $.fn.DataTable !== 'undefined') {
      const tables = document.querySelectorAll('.datatable:not(.initialized)');
      
      if (tables.length > 0) {
        // Verbesserte Performance: Lazy loading
        requestAnimationFrame(() => {
          const options = {
            language: {
              url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/de-DE.json'
            },
            responsive: true,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Alle"]],
            pageLength: 10,
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>><"table-responsive"t><"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            // Reduzierte Rendering-Häufigkeit für bessere Performance
            deferRender: true,
            processing: true,
            stateSave: true,
            stateDuration: 60 * 60 * 24 // 1 Tag
          };
          
          tables.forEach(table => {
            // Nur initialisieren, wenn noch nicht initialisiert
            if (!$.fn.DataTable.isDataTable(table)) {
              $(table).addClass('initialized').DataTable(options);
            }
          });
        });
      }
    }
  }
  
  // Optimierte Chart-Initialisierung
  let charts = {};
  function initCharts() {
    // Revenue Chart
    initChart('revenueChart', chart => {
      if (!chart || !window.Chart || !window.revenueChartData) return null;
      
      return new Chart(chart, {
        type: 'line',
        data: {
          labels: revenueChartData.labels || [],
          datasets: [{
            label: 'Umsatz',
            data: revenueChartData.data || [],
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.1)',
            tension: 0.3,
            fill: true,
            borderWidth: 2,
            pointBackgroundColor: '#198754',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  return '€' + context.parsed.y.toLocaleString('de-DE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  });
                }
              },
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              titleFont: { size: 13 },
              bodyFont: { size: 12 },
              padding: 10,
              cornerRadius: 4
            }
          },
          hover: {
            mode: 'nearest',
            intersect: false
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '€' + value.toLocaleString('de-DE');
                },
                font: { size: 11 }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false
              }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } }
            }
          }
        }
      });
    });
    
    // Services Chart
    initChart('servicesChart', chart => {
      if (!chart || !window.Chart || !window.servicesChartData) return null;
      
      return new Chart(chart, {
        type: 'doughnut',
        data: {
          labels: servicesChartData.labels || [],
          datasets: [{
            data: servicesChartData.data || [],
            backgroundColor: [
              'rgba(25, 135, 84, 0.8)',
              'rgba(13, 110, 253, 0.8)',
              'rgba(255, 193, 7, 0.8)',
              'rgba(108, 117, 125, 0.8)'
            ],
            borderColor: '#ffffff',
            borderWidth: 1,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { size: 11 }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${label}: €${value.toLocaleString('de-DE')} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    });
  }
  
  // Helper-Funktion für Chart-Initialisierung
  function initChart(chartId, createFn) {
    const chartEl = document.getElementById(chartId);
    
    if (chartEl) {
      // Destroy existing chart if it exists
      if (charts[chartId]) {
        charts[chartId].destroy();
      }
      
      // Create a new chart
      charts[chartId] = createFn(chartEl);
    }
  }
  
  // Kalender-Lazy-Loading
  function initCalendar() {
    const calendarTab = document.getElementById('calendar-tab');
    const calendarContainer = document.getElementById('calendar');
    
    if (calendarTab && calendarContainer) {
      // Nur binden, wenn nicht bereits initialisiert
      if (!calendarTab.hasAttribute('data-calendar-init')) {
        calendarTab.setAttribute('data-calendar-init', 'true');
        
        calendarTab.addEventListener('shown.bs.tab', function() {
          if (!window.calendar) {
            // Dynamisch laden
            if (typeof FullCalendar === 'undefined') {
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@5.10.1/main.min.js';
              script.onload = initializeCalendarInstance;
              
              const style = document.createElement('link');
              style.rel = 'stylesheet';
              style.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@5.10.1/main.min.css';
              
              document.head.appendChild(style);
              document.head.appendChild(script);
            } else {
              initializeCalendarInstance();
            }
          }
        });
      }
    }
    
    // Kalendar-Initialisierung
    function initializeCalendarInstance() {
      if (!window.calendar) {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;
        
        window.calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth',
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          },
          locale: 'de',
          events: '/dashboard/termine/api/events',
          eventClick: function(info) {
            window.location.href = '/dashboard/termine/' + info.event.id;
          },
          // Für mobile Geräte optimierte Optionen
          height: 'auto',
          windowResize: debounce(function() {
            if (window.innerWidth < 768) {
              window.calendar.changeView('listWeek');
            } else {
              window.calendar.changeView('dayGridMonth');
            }
          }, 250)
        });
        window.calendar.render();
      }
    }
  }
  
  // Verbesserte Formularvalidierung
  function initFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    forms.forEach(form => {
      // Verhindere mehrfache Eventbindung
      if (form.getAttribute('data-validation-init') === 'true') return;
      form.setAttribute('data-validation-init', 'true');
      
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        form.classList.add('was-validated');
      }, false);
      
      // Verbesserte Feldvalidierung mit Debounce
      const emailField = form.querySelector('input[type="email"]');
      if (emailField) {
        emailField.addEventListener('blur', function() {
          const value = this.value.trim();
          if (value && !isValidEmail(value)) {
            this.setCustomValidity('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
          } else {
            this.setCustomValidity('');
          }
        });
      }
      
      const phoneField = form.querySelector('input[type="tel"]');
      if (phoneField) {
        phoneField.addEventListener('blur', function() {
          const value = this.value.trim();
          if (value && !isValidPhone(value)) {
            this.setCustomValidity('Bitte geben Sie eine gültige Telefonnummer ein.');
          } else {
            this.setCustomValidity('');
          }
        });
      }
    });
    
    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function isValidPhone(phone) {
      return /^[+\d\s\-()]{6,20}$/.test(phone);
    }
  }
  
  // Effizientere Modal-Initialisierung mit Event-Delegation
  function initModals() {
    // Globaler Event-Listener für Modals statt individueller Listener
    document.addEventListener('show.bs.modal', function(event) {
      const modal = event.target;
      const button = event.relatedTarget;
      
      // Status-Modal-Handler
      if (modal.id === 'statusModal' && button) {
        const id = button.getAttribute('data-id');
        const status = button.getAttribute('data-status');
        
        const idInput = modal.querySelector('input[name="id"]');
        const statusSelect = modal.querySelector('select[name="status"]');
        
        if (idInput) idInput.value = id || '';
        if (statusSelect && status) statusSelect.value = status;
      }
      
      // Delete-Modal-Handler
      if (modal.id === 'deleteCustomerModal' && button) {
        const customerId = button.getAttribute('data-id');
        const customerName = button.getAttribute('data-name');
        
        const idInput = modal.querySelector('#customerIdToDelete');
        const nameElement = modal.querySelector('#customerNameToDelete');
        
        if (idInput) idInput.value = customerId || '';
        if (nameElement) nameElement.textContent = customerName || '';
      }
      
      // Weitere Modal-Handler können hier hinzugefügt werden...
    });
    
    // Service-Edit-Modal mit optimiertem Event-Handling
    document.addEventListener('click', function(event) {
      const target = event.target.closest('.edit-service');
      if (!target) return;
      
      const serviceId = target.getAttribute('data-id');
      if (serviceId) {
        fetchServiceDetails(serviceId);
      }
    });
    
    function fetchServiceDetails(id) {
      fetch(`/dashboard/dienste/${id}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            const service = data.service;
            const form = document.getElementById('editServiceForm');
            
            if (form) {
              form.querySelector('#edit_id').value = service.id;
              form.querySelector('#edit_name').value = service.name;
              form.querySelector('#edit_beschreibung').value = service.beschreibung || '';
              form.querySelector('#edit_preis_basis').value = service.preis_basis;
              form.querySelector('#edit_einheit').value = service.einheit;
              form.querySelector('#edit_mwst_satz').value = service.mwst_satz;
              form.querySelector('#edit_aktiv').checked = service.aktiv;
            }
          } else {
            showNotification('error', 'Fehler beim Laden der Dienstleistung: ' + data.error);
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showNotification('error', 'Fehler beim Laden der Dienstleistung');
        });
    }
  }
  
  // Optimierte Notifications mit automatischem Entfernen aus DOM
  function showNotification(type, message) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    // Prüfen, ob bereits eine ähnliche Benachrichtigung existiert
    const existingNotifications = document.querySelectorAll('.notification-toast');
    for (let i = 0; i < existingNotifications.length; i++) {
      if (existingNotifications[i].textContent.includes(message)) {
        // Verhindere Duplikate, stattdessen bestehende Benachrichtigung erneuern
        clearTimeout(existingNotifications[i].dataset.timeoutId);
        existingNotifications[i].remove();
        break;
      }
    }
    
    const alert = document.createElement('div');
    alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed notification-toast`;
    alert.style.top = '1rem';
    alert.style.right = '1rem';
    alert.style.zIndex = '9999';
    alert.style.maxWidth = '400px';
    alert.style.boxShadow = '0 0.25rem 0.75rem rgba(0, 0, 0, 0.1)';
    
    alert.innerHTML = `
      <i class="fas ${icon} me-2"></i>${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-close nach 5 Sekunden mit ordentlichem Entfernen aus DOM
    const timeoutId = setTimeout(() => {
      alert.classList.remove('show');
      
      // Nach dem Fade-Out vollständig aus DOM entfernen
      alert.addEventListener('transitionend', () => {
        alert.remove();
      }, { once: true });
      
      // Fallback für Browser, die transitionend nicht unterstützen
      setTimeout(() => {
        if (document.body.contains(alert)) {
          alert.remove();
        }
      }, 150);
    }, 5000);
    
    // Speichere Timeout-ID für mögliche Erneuerung
    alert.dataset.timeoutId = timeoutId;
    
    // Button-Event-Handler für manuelles Schließen
    const closeButton = alert.querySelector('.btn-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        clearTimeout(timeoutId);
      });
    }
  }
  
  // Optimiertes Toggle für Service-Status
  function initServiceToggle() {
    // Verwende Event-Delegation statt individueller Event-Listener
    document.addEventListener('change', function(event) {
      const toggle = event.target.closest('.service-toggle');
      if (!toggle) return;
      
      const serviceId = toggle.dataset.id;
      const isActive = toggle.checked;
      
      // CSRF-Token aus dem Meta-Tag abrufen
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      // Optimierter Fetch-Call mit Timeout und Fehlerverwaltung
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 Sekunden Timeout
      
      fetch(`/dashboard/dienste/toggle-status/${serviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify({ aktiv: isActive }),
        signal: controller.signal
      })
      .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error('Netzwerkantwort war nicht ok');
        }
        return response.json();
      })
      .then(data => {
        if (!data.success) {
          // Status zurücksetzen bei Fehler
          toggle.checked = !isActive;
          showNotification('error', 'Fehler beim Aktualisieren des Status');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        toggle.checked = !isActive;
        showNotification('error', error.name === 'AbortError' 
          ? 'Zeitüberschreitung bei der Anfrage' 
          : 'Fehler beim Aktualisieren des Status');
      });
    });
  }
  
  // Verhindere Form-Resubmission
  function preventFormResubmission() {
    if (window.history.replaceState) {
      window.history.replaceState(null, null, window.location.href);
    }
    
    // Zusätzlich: Deaktiviere Submit-Buttons nach Klick, um Doppelklicks zu verhindern
    document.addEventListener('submit', function(event) {
      const form = event.target;
      
      // Nur für Formulare, die nicht explizit ausgenommen sind
      if (!form.classList.contains('no-disable-on-submit')) {
        const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
        submitButtons.forEach(button => {
          button.disabled = true;
          
          // Optional: Lade-Text und Spinner hinzufügen
          if (button.tagName === 'BUTTON' && !button.querySelector('.spinner-border')) {
            const originalHTML = button.innerHTML;
            button.dataset.originalHTML = originalHTML;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird geladen...';
          }
        });
      }
    });
  }
  
  // Initialisiere alle Funktionen
  function init() {
    initSidebar();
    
    // Verwende requestAnimationFrame und Verzögerungen für nicht-kritische Komponenten
    requestAnimationFrame(() => {
      initFormValidation();
      initModals();
      preventFormResubmission();
      
      // Markiere aktiven Navigationslink
      const currentPath = window.location.pathname;
      document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath || 
            (link.getAttribute('href') !== '/dashboard' && currentPath.startsWith(link.getAttribute('href')))) {
          link.classList.add('active');
        }
      });
      
      // Verzögere nicht-kritische Komponenten
      setTimeout(() => {
        initDataTables();
        initCharts();
        initServiceToggle();
      }, 100);
      
      // Lazy-load des Kalenders nur bei Bedarf
      setTimeout(() => {
        initCalendar();
      }, 200);
    });
  }
  
  // Starte Initialisierung
  init();
  
  // Export von Funktionen für externe Nutzung
  window.DashboardUtils = {
    showNotification,
    refreshCharts: initCharts,
    refreshTables: initDataTables
  };
});

// Optimierter Suchcode für Kundenübersicht 
document.addEventListener('DOMContentLoaded', function() {
  const customerTable = document.getElementById('customerTable');
  const searchInput = document.getElementById('searchInput');
  
  // Client-seitige Suche mit Debounce
  let searchTimeout;
  function performSearch() {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      
      // Desktop-Tabellen-Ansicht
      if (customerTable) {
        const rows = customerTable.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
      }
      
      // Mobile-Karten-Ansicht
      const mobileCards = document.querySelectorAll('.list-group-item');
      mobileCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? '' : 'none';
      });
      
      // Aktualisiere "keine Ergebnisse" Nachricht
      updateNoResultsMessage(searchTerm);
    }, 300);
  }
  
  // "Keine Ergebnisse" Nachricht anzeigen/ausblenden
  function updateNoResultsMessage(searchTerm) {
    let visibleItems = 0;
    
    if (customerTable) {
      visibleItems = customerTable.querySelectorAll('tbody tr[style="display: ;"]').length;
    } else {
      visibleItems = document.querySelectorAll('.list-group-item[style="display: ;"]').length;
    }
    
    // Bestehende Nachricht entfernen
    const existingMessage = document.getElementById('noResultsMessage');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Wenn keine Ergebnisse und Suchbegriff nicht leer, Nachricht anzeigen
    if (visibleItems === 0 && searchTerm) {
      const noResultsMessage = document.createElement('div');
      noResultsMessage.id = 'noResultsMessage';
      noResultsMessage.className = 'alert alert-info text-center my-3';
      noResultsMessage.innerHTML = `
        <i class="fas fa-search me-2"></i>
        Keine Ergebnisse für "<strong>${searchTerm}</strong>".
      `;
      
      const container = customerTable 
        ? customerTable.parentNode 
        : document.querySelector('.list-group');
      
      if (container) {
        container.parentNode.insertBefore(noResultsMessage, container.nextSibling);
      }
    }
  }
  
  // Suchfeld-Event-Listener
  if (searchInput) {
    // Echtzeitsuche mit Debounce
    searchInput.addEventListener('input', performSearch);
    
    // Server-seitige Suche bei Enter
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault(); // Verhindere Standardverhalten
        
        if (this.value.trim()) {
          window.location.href = `/dashboard/kunden?search=${encodeURIComponent(this.value.trim())}`;
        }
      }
    });
  }
  
  // Event-Delegation für Filter
  document.addEventListener('click', function(e) {
    // Status-Filter
    const statusFilter = e.target.closest('[data-status-filter]');
    if (statusFilter) {
      e.preventDefault();
      const status = statusFilter.getAttribute('data-status-filter');
      window.location.href = status ? `/dashboard/kunden?status=${status}` : '/dashboard/kunden';
    }
    
    // Typ-Filter
    const typeFilter = e.target.closest('[data-type-filter]');
    if (typeFilter) {
      e.preventDefault();
      const type = typeFilter.getAttribute('data-type-filter');
      window.location.href = type ? `/dashboard/kunden?type=${type}` : '/dashboard/kunden';
    }
  });
  
  // Modal-Event-Handler mit Event-Delegation
  document.addEventListener('show.bs.modal', function(event) {
    const modal = event.target;
    const button = event.relatedTarget;
    
    if (!button) return;
    
    // Delete-Modal
    if (modal.id === 'deleteCustomerModal') {
      const customerId = button.getAttribute('data-id');
      const customerName = button.getAttribute('data-name');
      
      document.getElementById('customerIdToDelete').value = customerId;
      document.getElementById('customerNameToDelete').textContent = customerName;
    }
    
    // Status-Modal
    if (modal.id === 'changeStatusModal') {
      const customerId = button.getAttribute('data-id');
      const customerName = button.getAttribute('data-name');
      const currentStatus = button.getAttribute('data-status');
      
      document.getElementById('customerIdToChange').value = customerId;
      document.getElementById('customerNameToChange').textContent = customerName;
      document.getElementById('statusSelect').value = currentStatus;
    }
  });
});