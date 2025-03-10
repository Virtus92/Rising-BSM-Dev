/**
 * Dashboard Core JavaScript
 * Optimized for performance and mobile support
 */
document.addEventListener("DOMContentLoaded", function() {
    "use strict";
    
    // DOM-Cache für häufig verwendete Elemente
    const dashboardWrapper = document.querySelector('.dashboard-wrapper');
    const sidebarToggler = document.getElementById('sidebarToggle'); // Use ID instead of class
    const desktopSidebarToggle = document.querySelector('.desktop-sidebar-toggle');
    const searchInput = document.getElementById('searchInput');
    const navDropdowns = document.querySelectorAll('.nav-dropdown');
    const statusFilters = document.querySelectorAll('.status-filter');
    const sidebarOverlay = document.getElementById('sidebarOverlay'); // Get the overlay
    const sidebarClose = document.getElementById('sidebarClose'); // Get the close button

    // Sidebar-Funktionalität
    function initSidebar() {
      // Mobile Sidebar-Toggle
      if (sidebarToggler) {
        sidebarToggler.addEventListener('click', function() {
          dashboardWrapper.classList.toggle('sidebar-open');
          
          // Aria-Expanded für Barrierefreiheit
          const isOpen = dashboardWrapper.classList.contains('sidebar-open');
          this.setAttribute('aria-expanded', isOpen);

          // Show/hide the overlay
          if (sidebarOverlay) {
            sidebarOverlay.style.display = isOpen ? 'block' : 'none';
          }
        });
      }

      // Sidebar close button functionality
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
      
      // Sidebar schließen bei Klick außerhalb auf mobilen Geräten
      document.addEventListener('click', function(event) {
        if (window.innerWidth < 992 && 
            dashboardWrapper.classList.contains('sidebar-open') && 
            !event.target.closest('.dashboard-sidebar') && 
            !event.target.closest('#sidebarToggle')) { // Use ID
          dashboardWrapper.classList.remove('sidebar-open');
          if (sidebarToggler) sidebarToggler.setAttribute('aria-expanded', 'false');
          if (sidebarOverlay) sidebarOverlay.style.display = 'none'; // Hide overlay
        }
      });
    }
  
    // Dropdown-Verhalten
    function initDropdowns() {
      navDropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (trigger && menu) {
          trigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Alle anderen Dropdowns schließen
            navDropdowns.forEach(otherDropdown => {
              if (otherDropdown !== dropdown && otherDropdown.classList.contains('show')) {
                otherDropdown.classList.remove('show');
                otherDropdown.querySelector('.dropdown-menu').classList.remove('show');
              }
            });
            
            dropdown.classList.toggle('show');
            menu.classList.toggle('show');
          });
        }
      });
      
      // Dropdown bei Klick außerhalb schließen
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-dropdown')) {
          navDropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
            const menu = dropdown.querySelector('.dropdown-menu');
            if (menu) menu.classList.remove('show');
          });
        }
      });
    }
  
    // Status-Filter-Funktionalität
    function initStatusFilters() {
      statusFilters.forEach(filter => {
        filter.addEventListener('change', function() {
          const url = new URL(window.location);
          
          if (this.value === '' || this.value === 'all') {
            url.searchParams.delete('status');
          } else {
            url.searchParams.set('status', this.value);
          }
          
          window.location = url.toString();
        });
        
        // Aktuellen Filter-Wert setzen
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        if (status) {
          filter.value = status;
        }
      });
    }
  
    // Suchfunktionalität
    function initSearch() {
      if (searchInput) {
        const searchForm = searchInput.closest('form') || document.createElement('form');
        const searchButton = document.getElementById('searchButton');
        
        if (searchButton) {
          searchButton.addEventListener('click', function() {
            if (searchInput.value.trim()) {
              performSearch(searchInput.value);
            }
          });
        }
        
        searchInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (this.value.trim()) {
              performSearch(this.value);
            }
          }
        });
      }
      
      function performSearch(query) {
        // Implementiere hier die Suchlogik - entweder clientseitige Filterung 
        // oder Umleitung zur Suchseite
        const url = new URL(window.location);
        url.searchParams.set('search', query);
        window.location = url.toString();
      }
    }
  
  
  /**
   * Dropdown-Fehlerbehebung für Dashboard
   * Dieses Script behebt Probleme mit nicht funktionierenden Bootstrap-Dropdowns
   */
  
  // Funktion zur Initialisierung aller Dropdowns
  function initializeDropdowns() {
    // Manuelle Initialisierung der Dropdowns
    document.querySelectorAll('.dropdown-toggle').forEach(function(dropdownToggle) {
      if (!dropdownToggle.initialized) {
        dropdownToggle.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Schließe alle anderen Dropdowns
          document.querySelectorAll('.dropdown-menu.show').forEach(function(openMenu) {
            // Prüfen, ob das Menu nicht zum aktuellen Toggle gehört
            if (openMenu !== this.nextElementSibling) {
              openMenu.classList.remove('show');
              openMenu.parentElement.classList.remove('show');
            }
          });
          
          // Toggle des aktuellen Dropdown-Menüs
          const parent = this.parentElement;
          parent.classList.toggle('show');
          
          const menu = this.nextElementSibling;
          if (menu && menu.classList.contains('dropdown-menu')) {
            menu.classList.toggle('show');
          }
        });
        
        // Markiere als initialisiert, um doppelte Initialisierung zu vermeiden
        dropdownToggle.initialized = true;
      }
    });
    
    // Außerhalb klicken schließt alle Dropdowns
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(function(menu) {
          menu.classList.remove('show');
          if (menu.parentElement) {
            menu.parentElement.classList.remove('show');
          }
        });
      }
    });
    
    // Für "dropdown-toggle-split" Buttons, die als Split-Buttons fungieren
    document.querySelectorAll('.dropdown-toggle-split').forEach(function(splitButton) {
      if (!splitButton.initialized) {
        splitButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const parent = this.parentElement.parentElement;
          parent.classList.toggle('show');
          
          const menu = this.parentElement.nextElementSibling;
          if (menu && menu.classList.contains('dropdown-menu')) {
            menu.classList.toggle('show');
          }
        });
        
        // Markiere als initialisiert
        splitButton.initialized = true;
      }
    });
  }
  
  // Initialisiere Dropdowns beim Laden der Seite
  initializeDropdowns();
  
  // Für dynamisch hinzugefügte Elemente, z.B. in Tabs
  const observer = new MutationObserver(function(mutations) {
    let shouldReinitialize = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === 1 && (
              node.classList?.contains('dropdown') || 
              node.querySelector?.('.dropdown')
          )) {
            shouldReinitialize = true;
            break;
          }
        }
      }
    });
    
    if (shouldReinitialize) {
      initializeDropdowns();
      initCharts(); // Ensure charts are re-initialized after dynamic content is added
    }
  });
  
  // Observer starten - beobachte den gesamten Body auf Änderungen
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Fix für Bootstrap Dropdown in DataTables
  if (typeof $.fn !== 'undefined' && typeof $.fn.dataTable !== 'undefined') {
    $.fn.dataTable.ext.errMode = 'throw';
    
    // Überschreibe die DataTables-Initialisierung
    const originalDataTable = $.fn.dataTable;
    $.fn.dataTable = function(options) {
      const result = originalDataTable.apply(this, arguments);
      
      // Nach der Initialisierung Dropdowns neu initialisieren
      setTimeout(initializeDropdowns, 100);
      
      return result;
    };
    
    // Kopiere alle originalen Eigenschaften
    Object.keys(originalDataTable).forEach(key => {
      $.fn.dataTable[key] = originalDataTable[key];
    });
  }
  
  // Fix für Bootstrap-Modal-Events
  document.querySelectorAll('.modal').forEach(function(modal) {
    modal.addEventListener('shown.bs.modal', function() {
      // Dropdowns innerhalb von Modals neu initialisieren
      const modalDropdowns = this.querySelectorAll('.dropdown-toggle');
      modalDropdowns.forEach(function(dropdown) {
        dropdown.initialized = false;  // Reset, um Neuzuweisung zu ermöglichen
      });
      
      initializeDropdowns();
    });
  });
  
  // Fix für Tab-Wechsel-Events
  document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(function(tab) {
    tab.addEventListener('shown.bs.tab', function() {
      // Kurze Verzögerung, um sicherzustellen, dass der Tab-Inhalt geladen ist
      setTimeout(initializeDropdowns, 100);
      initCharts(); // Ensure charts are re-initialized on tab change
    });
  });
  
    // DataTables Initialisierung mit verzögertem Laden
    function initDataTables() {
      // Prüfen, ob DataTables vorhanden ist und Tabellen existieren
      if (typeof $.fn !== 'undefined' && typeof $.fn.DataTable !== 'undefined') {
        const tables = document.querySelectorAll('.datatable');
        
        if (tables.length > 0) {
          // Gemeinsame Optionen für alle Tabellen
          const options = {
            language: {
              url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/de-DE.json'
            },
            responsive: true,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Alle"]],
            pageLength: 10,
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>><"table-responsive"t><"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            // Spaltenspezifische Rendering-Optionen können hier definiert werden
          };
          
          // Initialisierung mit verzögertem Laden für bessere Gesamtleistung
          setTimeout(() => {
            tables.forEach(table => {
              // Nur initialisieren, wenn noch nicht initialisiert
              if (!$.fn.DataTable.isDataTable(table)) {
                $(table).DataTable(options);
              }
            });
          }, 100);
        }
      }
    }
    
    // Optimierte Chart-Initialisierung mit besserer Konfiguration
    let revenueChart = null;
    let servicesChart = null;
    function initCharts() {
      // Revenue Chart
      const revenueChartEl = document.getElementById('revenueChart');
      if (revenueChartEl && typeof Chart !== 'undefined' && typeof revenueChartData !== 'undefined') {
        // Destroy existing chart if it exists
        if (revenueChart) {
          revenueChart.destroy();
        }
      revenueChart = new Chart(revenueChartEl, {
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
          legend: {
          display: false
          },
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
          titleFont: {
            size: 13
          },
          bodyFont: {
            size: 12
          },
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
            font: {
            size: 11
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          }
          },
          x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
            size: 11
            }
          }
          }
        }
        }
      });
      }
    
      // Services Chart - Doughnut Chart
      const servicesChartEl = document.getElementById('servicesChart');
      if (servicesChartEl && typeof Chart !== 'undefined' && typeof servicesChartData !== 'undefined') {
        // Destroy existing chart if it exists
        if (servicesChart) {
          servicesChart.destroy();
        }
      servicesChart = new Chart(servicesChartEl, {
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
            font: {
            size: 11
            }
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
      }
    }
    
    // Kalender-Initialisierung (für die Termineseite)
    function initCalendar() {
      const calendarTab = document.getElementById('calendar-tab');
      const calendarContainer = document.getElementById('calendar');
      
      if (calendarTab && calendarContainer) {
      calendarTab.addEventListener('shown.bs.tab', function() {
        if (typeof FullCalendar === 'undefined') {
        // Dynamisches Laden der FullCalendar-Bibliothek, wenn nicht bereits geladen
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
      });
      }
      
      function initializeCalendarInstance() {
      if (!window.calendar) {
        const calendarEl = document.getElementById('calendar');
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
        windowResize: function(view) {
          if (window.innerWidth < 768) {
          window.calendar.changeView('listWeek');
          } else {
          window.calendar.changeView('dayGridMonth');
          }
        }
        });
        window.calendar.render();
      }
      }
    }
    
    // Formularvalidierung
    function initFormValidation() {
      const forms = document.querySelectorAll('.needs-validation');
      
      forms.forEach(form => {
        form.addEventListener('submit', event => {
          if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
          }
          
          form.classList.add('was-validated');
        }, false);
        
        // E-Mail-Feldvalidierung
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
        
        // Telefonfeldvalidierung
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
  
    // Modals Funktionalität
    function initModals() {
      // Status-Modal
      const statusModal = document.getElementById('statusModal');
      if (statusModal) {
        statusModal.addEventListener('show.bs.modal', function(event) {
          const button = event.relatedTarget;
          if (button) {
            const id = button.getAttribute('data-id');
            const status = button.getAttribute('data-status');
            
            const idInput = statusModal.querySelector('input[name="id"]');
            const statusSelect = statusModal.querySelector('select[name="status"]');
            
            if (idInput) idInput.value = id || '';
            if (statusSelect && status) statusSelect.value = status;
          }
        });
      }
      
      // Service-Edit-Modal für Dienstleistungen
      document.querySelectorAll('.edit-service').forEach(button => {
        button.addEventListener('click', function() {
          const serviceId = this.getAttribute('data-id');
          if (serviceId) {
            fetchServiceDetails(serviceId);
          }
        });
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
  
    // Notifikationen
    function showNotification(type, message) {
      const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
      const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
      
      const alert = document.createElement('div');
      alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
      alert.style.top = '1rem';
      alert.style.right = '1rem';
      alert.style.zIndex = '9999';
      alert.style.maxWidth = '400px';
      
      alert.innerHTML = `
        <i class="fas ${icon} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      
      document.body.appendChild(alert);
      
      // Auto-close nach 5 Sekunden
      setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
      }, 5000);
    }
  
    // Verhinderung von Form-Resubmission
    function preventFormResubmission() {
      if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
      }
    }
  
    // Service-Status-Toggle
    function initServiceToggle() {
      document.querySelectorAll('.service-toggle').forEach(toggle => {
        toggle.addEventListener('change', function() {
          const serviceId = this.dataset.id;
          const isActive = this.checked;
          
          // CSRF-Token aus dem Meta-Tag abrufen
          const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
          
          fetch(`/dashboard/dienste/toggle-status/${serviceId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'CSRF-Token': csrfToken
            },
            body: JSON.stringify({ aktiv: isActive })
          })
          .then(response => response.json())
          .then(data => {
            if (!data.success) {
              // Status zurücksetzen bei Fehler
              this.checked = !isActive;
              showNotification('error', 'Fehler beim Aktualisieren des Status');
            }
          })
          .catch(error => {
            console.error('Error:', error);
            this.checked = !isActive;
            showNotification('error', 'Fehler beim Aktualisieren des Status');
          });
        });
      });
    }
  
    // Alle Funktionen initialisieren
    function init() {
      initSidebar();
      initDropdowns();
      initStatusFilters();
      initSearch();
      initDataTables();
      initCharts();
      initCalendar();
      initFormValidation();
      initModals();
      initServiceToggle();
      preventFormResubmission();
      
      // Aktiven Navigationslink markieren
      const currentPath = window.location.pathname;
      document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath || 
            (link.getAttribute('href') !== '/dashboard' && currentPath.startsWith(link.getAttribute('href')))) {
          link.classList.add('active');
        }
      });
    }
  
    // Initialisierung starten
    init();
  });