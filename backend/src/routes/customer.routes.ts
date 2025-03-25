import { Router } from 'express';
import { 
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  updateCustomerStatus,
  addCustomerNote,
  getCustomerStatistics,
  exportCustomers,
  deleteCustomer,
  getCustomerInsights,
  getSimilarCustomers,
  searchCustomers,
  bulkUpdateCustomers,
  getCustomerHistory
} from '../controllers/customer.controller.js';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../middleware/validation.middleware.js';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';
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
router.get('/', validateQuery({
  ...commonSchemas.pagination,
  ...commonSchemas.search,
  ...commonSchemas.status,
  ...commonSchemas.sort,
  ...commonSchemas.dateRange,
  type: {
    type: 'string',
    required: false,
    enum: ['privat', 'geschaeft']
  },
  city: {
    type: 'string',
    required: false
  },
  postalCode: {
    type: 'string',
    required: false
  },
  newsletter: {
    type: 'boolean',
    required: false
  }
}), getAllCustomers);

/**
 * @route GET /api/v1/customers/search
 * @description Search customers with term and filters
 * @access Private
 */
router.get('/search', validateQuery({
  term: {
    type: 'string',
    required: true,
    minLength: 2,
    messages: {
      required: 'Search term is required',
      minLength: 'Search term must be at least 2 characters'
    }
  },
  ...commonSchemas.pagination
}), searchCustomers);

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
router.get('/export', validateQuery({
  format: {
    type: 'enum',
    enum: ['csv', 'excel'],
    default: 'csv',
    required: false
  },
  ...commonSchemas.search,
  ...commonSchemas.status,
  ...commonSchemas.dateRange,
  type: {
    type: 'string',
    required: false,
    enum: ['privat', 'geschaeft']
  }
}), exportCustomers);

/**
 * @route POST /api/v1/customers/bulk-update
 * @description Update multiple customers at once
 * @access Private (Admin only)
 */
router.post('/bulk-update', isAdmin, validateBody({
  customerIds: {
    type: 'array',
    required: true,
    items: {
      type: 'number'
    },
    messages: {
      required: 'Customer IDs are required',
      type: 'Customer IDs must be provided as an array'
    }
  },
  data: {
    type: 'object',
    required: true,
    schema: customerUpdateValidation,
    messages: {
      required: 'Update data is required',
      type: 'Update data must be an object'
    }
  }
}), bulkUpdateCustomers);

/**
 * @route GET /api/v1/customers/:id
 * @description Get customer by ID with related data
 * @access Private
 */
router.get('/:id', validateParams(commonSchemas.idParam), getCustomerById);

/**
 * @route GET /api/v1/customers/:id/insights
 * @description Get detailed insights for a customer
 * @access Private
 */
router.get('/:id/insights', validateParams(commonSchemas.idParam), getCustomerInsights);

/**
 * @route GET /api/v1/customers/:id/similar
 * @description Find customers with similar attributes
 * @access Private
 */
router.get('/:id/similar', validateParams(commonSchemas.idParam), getSimilarCustomers);

/**
 * @route GET /api/v1/customers/:id/history
 * @description Get customer activity history
 * @access Private
 */
router.get('/:id/history', validateParams(commonSchemas.idParam), getCustomerHistory);

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
router.put('/:id', validateParams(commonSchemas.idParam), validateBody(customerUpdateValidation), updateCustomer);

/**
 * @route DELETE /api/v1/customers/:id
 * @description Delete a customer (soft delete)
 * @access Private
 */
router.delete('/:id', validateParams(commonSchemas.idParam), deleteCustomer);

/**
 * @route PATCH /api/v1/customers/:id/status
 * @description Update customer status
 * @access Private
 */
router.patch('/:id/status', validateParams(commonSchemas.idParam), validateBody(customerStatusUpdateValidation), updateCustomerStatus);

/**
 * @route POST /api/v1/customers/:id/notes
 * @description Add a note to customer
 * @access Private
 */
router.post('/:id/notes', validateParams(commonSchemas.idParam), validateBody(customerNoteCreateValidation), addCustomerNote);

export default router;