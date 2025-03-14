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

// Register all API routes
router.use('/customers', customerRoutes);
router.use('/projects', projectRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/services', serviceRoutes);
router.use('/requests', requestRoutes);
router.use('/profile', profileRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;