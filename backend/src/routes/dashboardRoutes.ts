import { Router } from 'express';
import { IDashboardController } from '../interfaces/IDashboardController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';

/**
 * Dashboard routes configuration
 * 
 * @param controller - Dashboard controller
 * @param authMiddleware - Authentication middleware
 * @returns Express router
 */
export const configureDashboardRoutes = (
  controller: IDashboardController,
  authMiddleware: AuthMiddleware
): Router => {
  const router = Router();
  
  // Apply auth middleware to all dashboard routes
  router.use(authMiddleware.authenticate());
  
  /**
   * @route GET /api/dashboard
   * @desc Get dashboard data with optional filters
   * @access Private
   */
  router.get('/', controller.getDashboardData);
  
  /**
   * @route GET /api/dashboard/stats
   * @desc Get dashboard statistics
   * @access Private
   */
  router.get('/stats', controller.getStats);
  
  /**
   * @route GET /api/dashboard/search
   * @desc Perform global search across entities
   * @access Private
   */
  router.get('/search', controller.globalSearch);
  
  return router;
};

export default configureDashboardRoutes;