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
  getCustomerStatistics
} from '../controllers/customer.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  customerCreateSchema, 
  customerUpdateSchema, 
  customerStatusUpdateSchema 
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
router.post('/', validateBody(customerCreateSchema), createCustomer);

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
}), validateBody(customerUpdateSchema), updateCustomer);

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
}), validateBody(customerStatusUpdateSchema), updateCustomerStatus);

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
}), validateBody({
  note: {
    type: 'string',
    required: true,
    min: 1,
    max: 1000,
    messages: {
      required: 'Note text is required',
      min: 'Note text cannot be empty',
      max: 'Note text must not exceed 1000 characters'
    }
  }
}), addCustomerNote);

export default router;