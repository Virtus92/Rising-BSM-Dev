/**
 * API Routes
 * 
 * Main API router that combines all entity-specific routes.
 */
import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';
import { login } from '../controllers/auth.controller.js';

// Import route modules
import projectRoutes from './project.routes.js';
import customerRoutes from './customer.routes.js';
import appointmentRoutes from './appointment.routes.js';
import serviceRoutes from './service.routes.js';
import requestRoutes from './request.routes.js';
import profileRoutes from './profile.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import settingsRoutes from './settings.routes.js';
import notificationRoutes from './notification.routes.js';
import userRoutes from './user.routes.js';

// Create router
const router = Router();

// Direct auth routes
router.post('/login', login);

// Mount routes
router.use('/projects', projectRoutes);
router.use('/customers', customerRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/services', serviceRoutes);
router.use('/requests', requestRoutes);
router.use('/profile', profileRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);

/**
 * @route GET /api/v1/health
 * @description Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @route GET /api/v1/version
 * @description Get API version
 * @access Public
 */
router.get('/version', (req, res) => {
  res.status(200).json({
    version: process.env.npm_package_version || '1.0.0',
    name: process.env.npm_package_name || 'rising-bsm-api',
    timestamp: new Date().toISOString()
  });
});

export default router;