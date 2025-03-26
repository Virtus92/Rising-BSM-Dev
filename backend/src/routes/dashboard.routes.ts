/**
 * Dashboard Routes
 * 
 * Route definitions for dashboard operations with validation.
 */
import { Router } from 'express';
import { 
  getDashboardData,
  getDashboardStats,
  globalSearch
} from '../controllers/dashboard.controller.js';
import { validateQuery } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  dashboardFilterValidation,
  globalSearchValidation
} from '../dtos/deprecated/dashboard.dto.js';

// Create router
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/v1/dashboard
 * @description Get dashboard data including statistics, charts, and activities
 * @access Private
 */
router.get('/', validateQuery(dashboardFilterValidation), getDashboardData);

/**
 * @route GET /api/v1/dashboard/stats
 * @description Get dashboard statistics only
 * @access Private
 */
router.get('/stats', getDashboardStats);

/**
 * @route GET /api/v1/dashboard/search
 * @description Global search across all entities
 * @access Private
 */
router.get('/search', validateQuery(globalSearchValidation), globalSearch);

export default router;