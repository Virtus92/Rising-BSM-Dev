import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import * as requestController from '../controllers/request.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard/requests
 * @desc    Get all requests with optional filtering
 */
router.get('/', requestController.getAllRequests);

/**
 * @route   GET /dashboard/requests/:id
 * @desc    Get request by ID with related data
 */
router.get('/:id', requestController.getRequestById);

/**
 * @route   POST /dashboard/requests/status
 * @desc    Update request status
 */
router.post('/status', requestController.updateRequestStatus);

/**
 * @route   POST /dashboard/requests/:id/notes
 * @desc    Add a note to a request
 */
router.post('/:id/notes', requestController.addRequestNote);

/**
 * @route   GET /dashboard/requests/export
 * @desc    Export requests in various formats
 */
router.get('/export', requestController.exportRequests);

export default router;