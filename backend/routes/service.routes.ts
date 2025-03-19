import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import * as serviceController from '../controllers/service.controller';
import { validateService } from '../middleware/validation.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard/dienste
 * @desc    Get all services with optional filtering
 */
router.get('/', serviceController.getAllServices);

/**
 * @route   GET /dashboard/dienste/:id
 * @desc    Get service by ID
 */
router.get('/:id', serviceController.getServiceById);

/**
 * @route   POST /dashboard/dienste
 * @desc    Create a new service
 */
router.post('/', validateService, serviceController.createService);

/**
 * @route   PUT /dashboard/dienste/:id
 * @desc    Update an existing service
 */
router.put('/:id', validateService, serviceController.updateService);

/**
 * @route   POST /dashboard/dienste/:id/status
 * @desc    Toggle service status (active/inactive)
 */
router.post('/:id/status', serviceController.toggleServiceStatus);

/**
 * @route   GET /dashboard/dienste/:id/statistics
 * @desc    Get service statistics
 */
router.get('/:id/statistics', serviceController.getServiceStatistics);

export default router;