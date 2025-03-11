/**
 * Anfragen-Router
 * Zuständig für die Verwaltung von Kontaktanfragen
 */

const express = require('express');
const router = express.Router();
const anfrageController = require('../../controllers/anfragen.controller');

// Anfragen-Liste anzeigen
router.get('/', anfrageController.getAnfragen);

// Einzelne Anfrage anzeigen
router.get('/:id', anfrageController.getAnfrageDetails);

// Anfrage Status aktualisieren
router.post('/update-status', anfrageController.updateStatus);

// Mehrere Anfragen Status aktualisieren
router.post('/update-bulk-status', anfrageController.updateBulkStatus);

// Mehrere Anfragen löschen
router.post('/delete-bulk', anfrageController.deleteBulk);

// Anfragen-Notiz hinzufügen
router.post('/add-note', anfrageController.addNote);

// Export-Funktionalität
router.get('/export', anfrageController.exportAnfragen);

export default router;