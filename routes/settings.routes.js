const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Middleware für Authentifizierung
router.use(isAuthenticated);

/**
 * @route   GET /settings
 * @desc    Benutzereinstellungen anzeigen
 */
router.get('/', async (req, res, next) => {
  try {
    const settings = await settingsController.getUserSettings(req.session.userId);
    res.status(200).json({
      title: 'Einstellungen - Rising BSM',
      settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /settings/update
 * @desc    Benutzereinstellungen aktualisieren
 */
router.post('/update', async (req, res, next) => {
  try {
    await settingsController.updateUserSettings(req.session.userId, req.body);
    req.flash('success', 'Einstellungen wurden gespeichert');
    res.redirect('/settings');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/settings');
  }
});

/**
 * @route   GET /settings/system
 * @desc    Systemeinstellungen anzeigen (nur Admin)
 */
router.get('/system', isAdmin, async (req, res, next) => {
  try {
    const settings = await settingsController.getSystemSettings();
    res.status(200).json({
      title: 'Systemeinstellungen - Rising BSM',
      settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /settings/system/update
 * @desc    Systemeinstellungen aktualisieren (nur Admin)
 */
router.post('/system/update', isAdmin, async (req, res, next) => {
  try {
    await settingsController.updateSystemSettings(req.body);
    req.flash('success', 'Systemeinstellungen wurden gespeichert');
    res.redirect('/settings/system');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/settings/system');
  }
});

/**
 * @route   GET /settings/backup
 * @desc    Backup-Einstellungen anzeigen (nur Admin)
 */
router.get('/backup', isAdmin, async (req, res, next) => {
  try {
    const { settings, backups } = await settingsController.getBackupSettings();
    res.status(200).json({
      title: 'Backup-Einstellungen - Rising BSM',
      settings,
      backups
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /settings/backup/update
 * @desc    Backup-Einstellungen aktualisieren (nur Admin)
 */
router.post('/backup/update', isAdmin, async (req, res, next) => {
  try {
    await settingsController.updateBackupSettings(req.body);
    req.flash('success', 'Backup-Einstellungen wurden gespeichert');
    res.redirect('/settings/backup');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/settings/backup');
  }
});

/**
 * @route   POST /settings/backup/trigger
 * @desc    Manuelles Backup starten (nur Admin)
 */
router.post('/backup/trigger', isAdmin, async (req, res, next) => {
  try {
    const result = await settingsController.triggerManualBackup();
    req.flash('success', `Backup "${result.fileName}" wurde gestartet`);
    res.redirect('/settings/backup');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/settings/backup');
  }
});

module.exports = router;

