import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import * as customerController from '../controllers/customer.controller';
import { validateCustomer } from '../middleware/validation.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard/kunden
 * @desc    Get all customers
 */
router.get('/', customerController.getAllCustomers);

/**
 * @route   GET /dashboard/kunden/:id
 * @desc    Get customer by ID
 */
router.get('/:id', customerController.getCustomerById);

/**
 * @route   POST /dashboard/kunden
 * @desc    Create a new customer
 */
router.post('/', validateCustomer, customerController.createCustomer);

/**
 * @route   PUT /dashboard/kunden/:id
 * @desc    Update an existing customer
 */
router.put('/:id', validateCustomer, customerController.updateCustomer);

/**
 * @route   POST /dashboard/kunden/status
 * @desc    Update customer status
 */
router.post('/status', customerController.updateCustomerStatus);

/**
 * @route   POST /dashboard/kunden/:id/notes
 * @desc    Add a note to a customer
 */
router.post('/:id/notes', customerController.addCustomerNote);

/**
 * @route   DELETE /dashboard/kunden
 * @desc    Delete a customer (mark as deleted)
 */
router.delete('/', customerController.deleteCustomer);

/**
 * @route   GET /dashboard/kunden/export
 * @desc    Export customers in various formats
 */
router.get('/export', customerController.exportCustomers);

export default router;