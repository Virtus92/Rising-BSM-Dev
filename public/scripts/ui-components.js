/**
 * UI-Komponenten - Gemeinsame JavaScript-Funktionen
 */
document.addEventListener('DOMContentLoaded', function() {
    "use strict";
    
    // Initialisiere alle UI-Komponenten
    initCheckboxSelection();
    initDeleteModal();
    initExportModal();
    initStatusBadges();
    initFilters();
    initAiCallButton();
    
    /**
     * Checkbox-Selektion und Massenaktionen
     */
    function initCheckboxSelection() {
      const selectAll = document.getElementById('selectAll');
      if (!selectAll) return;
      
      const itemCheckboxes = document.querySelectorAll('.item-select');
      const bulkActions = document.querySelector('.bulk-actions');
      const selectedCountElement = document.getElementById('selectedCount');
      
      // "Alle auswählen" Checkbox
      selectAll.addEventListener('change', function() {
        itemCheckboxes.forEach(checkbox => {
          checkbox.checked = this.checked;
        });
        updateBulkActionsVisibility();
      });
      
      // Einzelne Checkboxen
      itemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
          updateSelectAllCheckbox();
          updateBulkActionsVisibility();
        });
      });
      
      // "Auswahl aufheben" Button
      const cancelSelectionBtn = document.querySelector('.cancel-selection');
      if (cancelSelectionBtn) {
        cancelSelectionBtn.addEventListener('click', function() {
          selectAll.checked = false;
          itemCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
          });
          updateBulkActionsVisibility();
        });
      }
      
      // Massenaktionen
      const bulkActionButtons = document.querySelectorAll('[data-action]');
      bulkActionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          
          const action = this.getAttribute('data-action');
          const value = this.getAttribute('data-value');
          const selectedIds = [];
          
          // Sammle alle ausgewählten IDs
          document.querySelectorAll('.item-select:checked').forEach(checkbox => {
            selectedIds.push(checkbox.value);
          });
          
          if (selectedIds.length === 0) return;
          
          // Basierend auf der Aktion handeln
          if (action === 'status') {
            updateBulkStatus(selectedIds, value);
          } else if (action === 'delete') {
            confirmBulkDelete(selectedIds);
          }
        });
      });
      
      // Lösch-Button für Massenaktionen
      const bulkDeleteBtn = document.querySelector('.bulk-delete');
      if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', function(e) {
          e.preventDefault();
          
          const selectedIds = [];
          document.querySelectorAll('.item-select:checked').forEach(checkbox => {
            selectedIds.push(checkbox.value);
          });
          
          if (selectedIds.length === 0) return;
          
          confirmBulkDelete(selectedIds);
        });
      }
      
      // Hilfsfunktionen
      function updateSelectAllCheckbox() {
        const checkedCount = document.querySelectorAll('.item-select:checked').length;
        selectAll.checked = checkedCount === itemCheckboxes.length && itemCheckboxes.length > 0;
        selectAll.indeterminate = checkedCount > 0 && checkedCount < itemCheckboxes.length;
      }
      
      function updateBulkActionsVisibility() {
        const checkedCount = document.querySelectorAll('.item-select:checked').length;
        
        if (bulkActions) {
          if (checkedCount > 0) {
            bulkActions.classList.remove('d-none');
            if (selectedCountElement) {
              selectedCountElement.textContent = checkedCount;
            }
          } else {
            bulkActions.classList.add('d-none');
          }
        }
      }
      
      function updateBulkStatus(ids, status) {
        // CSRF-Token aus Meta-Tag holen
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Aktuelle URL-Pfad für die richtige API-Endpunkt-Bestimmung
        const pathParts = window.location.pathname.split('/');
        const module = pathParts[2]; // z.B. "kunden", "anfragen", etc.
        
        fetch(`/dashboard/${module}/update-bulk-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken
          },
          body: JSON.stringify({ ids, status })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            showNotification('success', `Status für ${ids.length} Einträge aktualisiert.`);
            setTimeout(() => window.location.reload(), 1000);
          } else {
            showNotification('error', data.error || 'Fehler beim Aktualisieren des Status.');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showNotification('error', 'Fehler beim Aktualisieren des Status.');
        });
      }
      
      function confirmBulkDelete(ids) {
        if (confirm(`Sind Sie sicher, dass Sie ${ids.length} Einträge löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
          deleteBulkItems(ids);
        }
      }
      
      function deleteBulkItems(ids) {
        // CSRF-Token aus Meta-Tag holen
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Aktuelle URL-Pfad für die richtige API-Endpunkt-Bestimmung
        const pathParts = window.location.pathname.split('/');
        const module = pathParts[2]; // z.B. "kunden", "anfragen", etc.
        
        fetch(`/dashboard/${module}/delete-bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken
          },
          body: JSON.stringify({ ids })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            showNotification('success', `${ids.length} Einträge wurden gelöscht.`);
            setTimeout(() => window.location.reload(), 1000);
          } else {
            showNotification('error', data.error || 'Fehler beim Löschen der Einträge.');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showNotification('error', 'Fehler beim Löschen der Einträge.');
        });
      }
    }
    
    /**
     * Lösch-Modal Initialisierung
     */
    function initDeleteModal() {
      const deleteModal = document.getElementById('deleteModal');
      if (!deleteModal) return;
      
      // Verwende Event-Delegation für alle löschen-Buttons
      document.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.delete-item');
        if (!deleteButton) return;
        
        event.preventDefault();
        
        const id = deleteButton.getAttribute('data-id');
        const name = deleteButton.getAttribute('data-name');
        const type = deleteButton.getAttribute('data-type') || 'Eintrag';
        
        // Modal konfigurieren
        document.querySelectorAll('.delete-item-name').forEach(el => el.textContent = name);
        document.querySelectorAll('.delete-item-type').forEach(el => el.textContent = type);
        
        const idInput = document.getElementById('deleteItemId');
        if (idInput) idInput.value = id;
        
        // Form-Action basierend auf aktueller URL setzen
        const pathParts = window.location.pathname.split('/');
        const module = pathParts[2]; // z.B. "kunden", "anfragen", etc.
        
        const deleteForm = document.getElementById('deleteForm');
        if (deleteForm) {
          deleteForm.action = `/dashboard/${module}/delete`;
        }
        
        // Modal öffnen
        const bsModal = new bootstrap.Modal(deleteModal);
        bsModal.show();
      });
    }
    
    /**
     * Export-Modal Initialisierung
     */
    function initExportModal() {
      const exportModal = document.getElementById('exportModal');
      if (!exportModal) return;
      
      // Aktuelles Datum für Datumfelder vorbelegen
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      
      const dateFromInput = document.getElementById('dateFrom');
      const dateToInput = document.getElementById('dateTo');
      
      if (dateFromInput) {
        dateFromInput.value = formatDate(lastMonth);
      }
      
      if (dateToInput) {
        dateToInput.value = formatDate(today);
      }
      
      function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    
    /**
     * Status-Badges einheitlich gestalten
     */
    function initStatusBadges() {
      // Status-Badges dynamisch umwandeln
      document.querySelectorAll('[data-status]').forEach(element => {
        const status = element.getAttribute('data-status');
        const statusLabel = element.textContent.trim();
        
        if (!status) return;
        
        // Icon basierend auf Status bestimmen
        let icon = 'circle';
        
        switch (status) {
          case 'neu':
          case 'geplant':
          case 'new':
            icon = 'circle';
            break;
          case 'aktiv':
          case 'active':
          case 'bestaetigt':
            icon = 'check-circle';
            break;
          case 'in_bearbeitung':
          case 'processing':
            icon = 'spinner';
            break;
          case 'abgeschlossen':
          case 'beantwortet':
          case 'completed':
            icon = 'check-double';
            break;
          case 'storniert':
          case 'geschlossen':
          case 'canceled':
            icon = 'times-circle';
            break;
        }
        
        // Badge HTML erstellen
        element.className = `status-badge status-${status}`;
        element.innerHTML = `<i class="status-icon fas fa-${icon}"></i>${statusLabel}`;
      });
    }
    
    /**
     * Filter-Funktionalitäten
     */
    function initFilters() {
      // Such-Formular mit Verzögerung (Debounce)
      const searchForm = document.getElementById('searchForm');
      const searchInput = document.getElementById('searchInput');
      
      if (searchInput && searchForm) {
        let searchTimeout;
        
        // Live-Suche bei Eingabe
        searchInput.addEventListener('input', function() {
          clearTimeout(searchTimeout);
          
          searchTimeout = setTimeout(() => {
            if (this.value.length > 1 || this.value.length === 0) {
              searchForm.submit();
            }
          }, 500);
        });
        
        // Reset-Button für Filter
        const resetButton = searchForm.querySelector('button[type="reset"]');
        if (resetButton) {
          resetButton.addEventListener('click', function() {
            // Alle Checkboxen zurücksetzen
            searchForm.querySelectorAll('input[type="checkbox"]').forEach(cb => {
              cb.checked = false;
            });
            
            // Suchfeld leeren
            if (searchInput) searchInput.value = '';
            
            // Formular absenden
            searchForm.submit();
          });
        }
      }
      
      // Status-Filter für Tabellen
      const tableFilter = document.getElementById('tableFilter');
      if (tableFilter) {
        tableFilter.addEventListener('change', function() {
          const rows = document.querySelectorAll('tbody tr');
          const value = this.value.toLowerCase();
          
          if (value === 'all' || value === '') {
            // Alle Zeilen anzeigen
            rows.forEach(row => {
              row.style.display = '';
            });
          } else {
            // Nach Status filtern
            rows.forEach(row => {
              const statusCell = row.querySelector('[data-status]');
              if (statusCell) {
                const rowStatus = statusCell.getAttribute('data-status');
                row.style.display = rowStatus === value ? '' : 'none';
              }
            });
          }
          
          // Aktualisiere "keine Ergebnisse" Nachricht
          updateNoResultsMessage();
        });
      }
      
      function updateNoResultsMessage() {
        // Zähle sichtbare Zeilen
        const visibleRows = document.querySelectorAll('tbody tr:not([style*="display: none"])').length;
        
        // Bestehende Nachricht entfernen
        const existingMessage = document.getElementById('noResultsMessage');
        if (existingMessage) {
          existingMessage.remove();
        }
        
        // Wenn keine Ergebnisse, Nachricht anzeigen
        if (visibleRows === 0) {
          const noResultsMessage = document.createElement('div');
          noResultsMessage.id = 'noResultsMessage';
          noResultsMessage.className = 'alert alert-info text-center my-3';
          noResultsMessage.innerHTML = `
            <i class="fas fa-filter me-2"></i>
            Keine Einträge für die aktuellen Filter gefunden.
          `;
          
          const table = document.querySelector('table');
          if (table) {
            table.parentNode.insertBefore(noResultsMessage, table.nextSibling);
          }
        }
      }
    }
    
    /**
     * AI-Anruf Button Funktionalität
     */
    function initAiCallButton() {
      document.querySelectorAll('.ai-call-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          const phone = this.getAttribute('data-phone');
          
          if (!phone) {
            showNotification('error', 'Keine Telefonnummer verfügbar.');
            return;
          }
          
          // Speichere ursprünglichen Button-Inhalt
          const originalContent = this.innerHTML;
          
          // Animationsabfolge
          this.disabled = true;
          this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Wird vorbereitet...';
          
          // CSRF-Token aus Meta-Tag holen
          const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
          
          // Simuliere API-Aufruf
          setTimeout(() => {
            // Hier später durch echten API-Aufruf ersetzen
            fetch('/api/ai-call', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
              },
              body: JSON.stringify({ id, phone })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                this.innerHTML = '<i class="fas fa-check me-1"></i> Anruf initiiert';
                showNotification('success', `AI-Anruf an ${phone} wurde initiiert.`);
              } else {
                this.innerHTML = originalContent;
                this.disabled = false;
                showNotification('error', data.error || 'Fehler beim Initiieren des Anrufs.');
              }
            })
            .catch(error => {
              console.error('Error:', error);
              this.innerHTML = originalContent;
              this.disabled = false;
              showNotification('error', 'Fehler beim Initiieren des Anrufs.');
            })
            .finally(() => {
              // Nach 3 Sekunden Button zurücksetzen
              setTimeout(() => {
                this.disabled = false;
                this.innerHTML = originalContent;
              }, 3000);
            });
          }, 1500);
        });
      });
    }
    
    /**
     * Toast-Benachrichtigungen
     */
    window.showNotification = function(type, message, duration = 5000) {
      const toastContainer = document.getElementById('toastContainer');
      if (!toastContainer) return;
      
      // Prüfen, ob bereits eine ähnliche Benachrichtigung existiert
      const existingToasts = toastContainer.querySelectorAll('.toast');
      for (let i = 0; i < existingToasts.length; i++) {
        if (existingToasts[i].textContent.includes(message)) {
          return; // Verhindere Duplikate
        }
      }
      
      // Toast erstellen
      const toastEl = document.createElement('div');
      toastEl.className = `toast align-items-center border-0 bg-${type === 'success' ? 'success' : 'danger'} text-white`;
      toastEl.setAttribute('role', 'alert');
      toastEl.setAttribute('aria-live', 'assertive');
      toastEl.setAttribute('aria-atomic', 'true');
      
      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
      
      toastContainer.appendChild(toastEl);
      
      // Toast initialisieren und anzeigen
      const toast = new bootstrap.Toast(toastEl, {
        delay: duration,
        autohide: true
      });
      
      toast.show();
      
      // Nach dem Ausblenden aus DOM entfernen
      toastEl.addEventListener('hidden.bs.toast', function() {
        this.remove();
      });
    };
  });