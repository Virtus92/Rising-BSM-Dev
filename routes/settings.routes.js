const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard/settings
 * @desc    Display settings page
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await settingsController.getUserSettings(req, res, next);
    
    // Render the view
    res.render('dashboard/settings/index', {
      title: 'Einstellungen - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/settings',
      settings: data.settings,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /dashboard/settings/update
 * @desc    Update user settings
 */
router.post('/update', async (req, res, next) => {
  try {
    await settingsController.updateUserSettings(req, res, next);
    
    // Update session data
    req.session.user.sprache = req.body.sprache || 'de';
    req.session.user.dark_mode = req.body.dark_mode === 'on' || req.body.dark_mode === true;
    
    // Set flash message and redirect
    req.flash('success', 'Einstellungen erfolgreich gespeichert.');
    res.redirect('/dashboard/settings');
  } catch (error) {
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/settings');
  }
});

/**
 * @route   GET /dashboard/settings/system
 * @desc    Display system settings page (admin only)
 */
router.get('/system', async (req, res, next) => {
  try {
    const data = await settingsController.getSystemSettings(req, res, next);
    
    // Render the view
    res.render('dashboard/settings/system', {
      title: 'Systemeinstellungen - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/settings/system',
      settings: data.settings,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /dashboard/settings/system/update
 * @desc    Update system settings (admin only)
 */
router.post('/system/update', async (req, res, next) => {
  try {
    await settingsController.updateSystemSettings(req, res, next);
    
    // Set flash message and redirect
    req.flash('success', 'Systemeinstellungen erfolgreich gespeichert.');
    res.redirect('/dashboard/settings/system');
  } catch (error) {
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/settings/system');
  }
});

/**
 * @route   GET /dashboard/settings/backup
 * @desc    Display backup settings page (admin only)
 */
router.get('/backup', async (req, res, next) => {
  try {
    const data = await settingsController.getBackupSettings(req, res, next);
    
    // Render the view
    res.render('dashboard/settings/backup', {
      title: 'Backup Einstellungen - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/settings/backup',
      settings: data.settings,
      backups: data.backups,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /dashboard/settings/backup/update
 * @desc    Update backup settings (admin only)
 */
router.post('/backup/update', async (req, res, next) => {
  try {
    await settingsController.updateBackupSettings(req, res, next);
    
    // Set flash message and redirect
    req.flash('success', 'Backup Einstellungen erfolgreich gespeichert.');
    res.redirect('/dashboard/settings/backup');
  } catch (error) {
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/settings/backup');
  }
});

/**
 * @route   POST /dashboard/settings/backup/trigger
 * @desc    Trigger manual backup (admin only)
 */
router.post('/backup/trigger', async (req, res, next) => {
  try {
    await settingsController.triggerManualBackup(req, res, next);
    
    // Set flash message and redirect
    req.flash('success', 'Manuelle Sicherung wurde gestartet.');
    res.redirect('/dashboard/settings/backup');
  } catch (error) {
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/settings/backup');
  }
});

module.exports = router;

