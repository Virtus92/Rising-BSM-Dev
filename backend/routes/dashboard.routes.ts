import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import * as dashboardController from '../controllers/dashboard.controller';
import { prepareDashboardContextMiddleware } from '../middleware/dashboard.middleware';

const router = Router();

// Apply authentication middleware to all dashboard routes
router.use(isAuthenticated);

// Apply dashboard context middleware
router.use(prepareDashboardContextMiddleware);

/**
 * @route   GET /dashboard
 * @desc    Dashboard home page with stats and overview
 */
router.get('/', dashboardController.getDashboardData);

/**
 * @route   GET /dashboard/search
 * @desc    Global search across all entities
 */
router.get('/search', dashboardController.globalSearch);

/**
 * @route   GET /dashboard/notifications
 * @desc    View all notifications
 */
router.get('/notifications', dashboardController.getNotifications);

/**
 * @route   POST /dashboard/notifications/mark-read
 * @desc    Mark notification(s) as read
 */
router.post('/notifications/mark-read', dashboardController.markNotificationsRead);

/**
 * @route   GET /dashboard/stats
 * @desc    API endpoint for dashboard statistics
 */
router.get('/stats', dashboardController.getDashboardStats);

export default router;