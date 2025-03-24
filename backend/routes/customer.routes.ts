/**
 * Customer Routes
 * 
 * Route definitions for Customer entity operations with validation.
 */
import { Router } from 'express';
import { 
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  updateCustomerStatus,
  addCustomerNote,
  getCustomerStatistics,
  exportCustomers
} from '../controllers/customer.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  customerCreateValidation, 
  customerUpdateValidation,
  customerStatusUpdateValidation,
  customerNoteCreateValidation,
  CustomerStatus
} from '../types/dtos/customer.dto.js';

// Create router
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/v1/customers
 * @description Get all customers with filtering and pagination
 * @access Private
 */
router.get('/', getAllCustomers);

/**
 * @route GET /api/v1/customers/statistics
 * @description Get customer statistics
 * @access Private
 */
router.get('/statistics', getCustomerStatistics);

/**
 * @route GET /api/v1/customers/export
 * @description Export customers data
 * @access Private
 */
router.get('/export', exportCustomers);

/**
 * @route GET /api/v1/customers/:id
 * @description Get customer by ID with related data
 * @access Private
 */
router.get('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Customer ID is required',
      type: 'Customer ID must be a number'
    }
  }
}), getCustomerById);

/**
 * @route POST /api/v1/customers
 * @description Create a new customer
 * @access Private
 */
router.post('/', validateBody(customerCreateValidation), createCustomer);

/**
 * @route PUT /api/v1/customers/:id
 * @description Update an existing customer
 * @access Private
 */
router.put('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Customer ID is required',
      type: 'Customer ID must be a number'
    }
  }
}), validateBody(customerUpdateValidation), updateCustomer);

/**
 * @route PATCH /api/v1/customers/:id/status
 * @description Update customer status
 * @access Private
 */
router.patch('/:id/status', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Customer ID is required',
      type: 'Customer ID must be a number'
    }
  }
}), validateBody(customerStatusUpdateValidation), updateCustomerStatus);

/**
 * @route POST /api/v1/customers/:id/notes
 * @description Add a note to customer
 * @access Private
 */
router.post('/:id/notes', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Customer ID is required',
      type: 'Customer ID must be a number'
    }
  }
}), validateBody(customerNoteCreateValidation), addCustomerNote);

export default router;