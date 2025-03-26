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
import { submitContact } from '../controllers/contact.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  requestStatusUpdateSchema, 
  requestNoteCreateSchema,
  contactRequestCreateValidation
} from '../dtos/deprecated/request.dto.js';

// Create router
const router = Router();

// Apply authentication middleware to all admin routes
router.use('/admin', authenticate);

/**
 * @route POST /api/v1/requests/contact
 * @description Submit a new contact request
 * @access Public
 */
router.post('/contact', validateBody(contactRequestCreateValidation), submitContact);

/**
 * @route GET /api/v1/requests/admin
 * @description Get all contact requests with filtering and pagination
 * @access Private
 */
router.get('/admin', getAllRequests);

/**
 * @route GET /api/v1/requests/admin/export
 * @description Export contact requests data
 * @access Private
 */
router.get('/admin/export', exportRequests);

/**
 * @route GET /api/v1/requests/admin/:id
 * @description Get contact request by ID with related data
 * @access Private
 */
router.get('/admin/:id', validateParams({
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
 * @route PATCH /api/v1/requests/admin/:id/status
 * @description Update contact request status
 * @access Private
 */
router.patch('/admin/:id/status', validateParams({
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
 * @route POST /api/v1/requests/admin/:id/notes
 * @description Add a note to contact request
 * @access Private
 */
router.post('/admin/:id/notes', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Request ID is required',
      type: 'Request ID must be a number'
    }
  }
}), validateBody(requestNoteCreateSchema), addRequestNote);

export default router;