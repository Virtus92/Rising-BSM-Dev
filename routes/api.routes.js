/**
 * API Routes
 * Central file for all API route registration
 */
const express = require('express');
const router = express.Router();

// Import all route modules
const customerRoutes = require('./customer.routes');
const projectRoutes = require('./project.routes');
const appointmentRoutes = require('./appointment.routes');
const serviceRoutes = require('./service.routes');
const requestRoutes = require('./request.routes');
const profileRoutes = require('./profile.routes');
const settingsRoutes = require('./settings.routes');
const dashboardRoutes = require('./dashboard.routes');

// Simple test endpoint to verify API is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'API is working correctly' });
});

// Register all API routes
router.use('/customers', customerRoutes);
router.use('/projects', projectRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/services', serviceRoutes);
router.use('/requests', requestRoutes);
router.use('/profile', profileRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);

// Add German route aliases if needed
router.use('/kunden', customerRoutes);
router.use('/projekte', projectRoutes);
router.use('/termine', appointmentRoutes);
router.use('/dienste', serviceRoutes);

module.exports = router;