/**
 * Request Routes
 * 
 * Route definitions for Contact Request entity operations with validation.
 */
import { Router } from 'express';
import { 
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  addRequestNote,
  exportRequests
} from '../controllers/request.controller.js';
import { 
  getContactRequest, 
  submitContact 
} from '../controllers/contact.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  requestStatusUpdateSchema, 
  requestNoteCreateSchema 
} from '../types/dtos/request.dto.js';

// Create router
const router = Router();

// Apply authentication middleware to all routes (except submitContact)
router.use(authenticate);

/**
 * @route GET /api/v1/requests
 * @description Get all contact requests with filtering and pagination
 * @access Private
 */
router.get('/', getAllRequests);

/**
 * @route GET /api/v1/requests/:id
 * @description Get contact request by ID with related data
 * @access Private
 */
router.get('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Request ID is required',
      type: 'Request ID must be a number'
    }
  }
}), getRequestById);

/**
 * @route PATCH /api/v1/requests/:id/status
 * @description Update contact request status
 * @access Private
 */
router.patch('/:id/status', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Request ID is required',
      type: 'Request ID must be a number'
    }
  }
}), validateBody(requestStatusUpdateSchema), updateRequestStatus);

/**
 * @route POST /api/v1/requests/:id/notes
 * @description Add a note to contact request
 * @access Private
 */
router.post('/:id/notes', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Request ID is required',
      type: 'Request ID must be a number'
    }
  }
}), validateBody(requestNoteCreateSchema), addRequestNote);

/**
 * @route GET /api/v1/requests/export
 * @description Export contact requests data
 * @access Private
 */
router.get('/export', exportRequests);

export default router;