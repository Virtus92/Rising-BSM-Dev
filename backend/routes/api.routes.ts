/**
 * API Routes
 * 
 * Main API router that combines all entity-specific routes.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import authRoutes from './auth.routes.js';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { loginValidation } from '../types/dtos/auth.dto.js';
import { login } from '../controllers/auth.controller.js';

// Import other route modules
// import projectRoutes from './project.routes.js';
import customerRoutes from './customer.routes.js';
// import appointmentRoutes from './appointment.routes.js';
// import serviceRoutes from './service.routes.js';
// import requestRoutes from './request.routes.js';
// import profileRoutes from './profile.routes.js';
// import dashboardRoutes from './dashboard.routes.js';
// import settingsRoutes from './settings.routes.js';
import notificationRoutes from './notification.routes.js';
// import userRoutes from './user.routes.js';

// Create router
const router = Router();

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginDTO'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponseDTO'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateBody({
  email: {
    type: 'email',
    required: true,
    messages: {
      required: 'Email is required',
      email: 'Invalid email format'
    }
  },
  password: {
    type: 'string',
    required: true,
    messages: {
      required: 'Password is required'
    }
  },
  remember: {
    type: 'boolean',
    required: false,
    default: false
  }
}), login);

// Mount authentication routes
router.use('/auth', authRoutes);


// Mount other routes
// router.use('/projects', authenticate, projectRoutes);
router.use('/customers', authenticate, customerRoutes);
// router.use('/appointments', authenticate, appointmentRoutes);
// router.use('/services', authenticate, serviceRoutes);
// router.use('/requests', authenticate, requestRoutes);
// router.use('/profile', authenticate, profileRoutes);
// router.use('/dashboard', authenticate, dashboardRoutes);
// router.use('/settings', authenticate, settingsRoutes);
router.use('/notifications', authenticate, notificationRoutes);
// router.use('/users', authenticate, userRoutes);

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API is running
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is operational
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
 * @swagger
 * /api/v1/version:
 *   get:
 *     summary: Get API version
 *     description: Get current API version information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Version information
 */
router.get('/version', (req, res) => {
  res.status(200).json({
    version: process.env.npm_package_version || '1.0.0',
    name: process.env.npm_package_name || 'rising-bsm-api',
    timestamp: new Date().toISOString()
  });
});

export default router;