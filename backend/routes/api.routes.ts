/**
 * API Routes
 * 
 * Main API router that combines all entity-specific routes.
 */
import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';

// Import route modules
import projectRoutes from './project.routes.js';
// Import other route modules as they are implemented
// import customerRoutes from './customer.routes';
// import appointmentRoutes from './appointment.routes';
// import serviceRoutes from './service.routes';
// import requestRoutes from './request.routes';
// import profileRoutes from './profile.routes';
// import dashboardRoutes from './dashboard.routes';
// import settingsRoutes from './settings.routes';

// Create router
const router = Router();

// Mount routes
router.use('/projects', projectRoutes);

// Mount other routes as they are implemented
// router.use('/customers', customerRoutes);
// router.use('/appointments', appointmentRoutes);
// router.use('/services', serviceRoutes);
// router.use('/requests', requestRoutes);
// router.use('/profile', profileRoutes);
// router.use('/dashboard', dashboardRoutes);
// router.use('/settings', settingsRoutes);

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