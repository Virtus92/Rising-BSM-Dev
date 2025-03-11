/**
 * Haupt-Dashboard-Router
 * Importiert und verwendet alle Subrouten
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, getNewRequestsCountMiddleware } = require('./utils/helpers');

// Subrouten importieren
const indexRoutes = require('./dashboard/index');
const anfragenRoutes = require('./dashboard/requests');
const kundenRoutes = require('./dashboard/kunden');
const termineRoutes = require('./dashboard/termine');
const diensteRoutes = require('./dashboard/dienste');
const projekteRoutes = require('./dashboard/projekte');
const settingsRoutes = require('./dashboard/settings');
const profileRoutes = require('./dashboard/profile');
const apiRoutes = require('./dashboard/api');

// Middleware für alle Dashboard-Routen anwenden
router.use(isAuthenticated);
router.use(getNewRequestsCountMiddleware);

// Subrouten einbinden
router.use('/', indexRoutes);
router.use('requests', anfragenRoutes);
router.use('/kunden', kundenRoutes);
router.use('/termine', termineRoutes);
router.use('/dienste', diensteRoutes);
router.use('/projekte', projekteRoutes);
router.use('/settings', settingsRoutes);
router.use('/profile', profileRoutes);
router.use('/api', apiRoutes);

// Logout Route - bleibt im Hauptrouter
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout-Fehler:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;