/**
 * Service Routes
 * 
 * Route definitions for Service entity operations with validation.
 */
import { Router } from 'express';
import { 
  getAllServices,
  getServiceById,
  createService,
  updateService,
  toggleServiceStatus,
  getServiceStatistics
} from '../controllers/service.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';
import { 
  serviceCreateValidation, 
  serviceUpdateValidation, 
  serviceStatusUpdateValidation 
} from '../types/dtos/service.dto.js';

// Create router
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/v1/services
 * @description Get all services with filtering and pagination
 * @access Private
 */
router.get('/', getAllServices);

/**
 * @route GET /api/v1/services/:id
 * @description Get service by ID
 * @access Private
 */
router.get('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Service ID is required',
      type: 'Service ID must be a number'
    }
  }
}), getServiceById);

/**
 * @route POST /api/v1/services
 * @description Create a new service
 * @access Admin only
 */
router.post('/', isAdmin, validateBody(serviceCreateValidation), createService);

/**
 * @route PUT /api/v1/services/:id
 * @description Update an existing service
 * @access Admin only
 */
router.put('/:id', isAdmin, validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Service ID is required',
      type: 'Service ID must be a number'
    }
  }
}), validateBody(serviceUpdateValidation), updateService);

/**
 * @route PATCH /api/v1/services/:id/status
 * @description Toggle service active status
 * @access Admin only
 */
router.patch('/:id/status', isAdmin, validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Service ID is required',
      type: 'Service ID must be a number'
    }
  }
}), validateBody(serviceStatusUpdateValidation), toggleServiceStatus);

/**
 * @route GET /api/v1/services/:id/statistics
 * @description Get service usage statistics
 * @access Private
 */
router.get('/:id/statistics', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Service ID is required',
      type: 'Service ID must be a number'
    }
  }
}), getServiceStatistics);

export default router;