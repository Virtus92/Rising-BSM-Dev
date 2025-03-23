/**
 * User Routes
 * 
 * Route definitions for User entity operations with validation.
 */
import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus
} from '../controllers/user.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';
import {
  userCreateSchema,
  userUpdateSchema
} from '../types/dtos/user.dto.js';

// Create router
const router = Router();

// Apply authentication and admin middleware to all routes
// Only admins should manage users
router.use(authenticate, isAdmin);

/**
 * @route GET /api/v1/users
 * @description Get all users with filtering and pagination
 * @access Admin only
 */
router.get('/', getAllUsers);

/**
 * @route GET /api/v1/users/:id
 * @description Get user by ID
 * @access Admin only
 */
router.get('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'User ID is required',
      type: 'User ID must be a number'
    }
  }
}), getUserById);

/**
 * @route POST /api/v1/users
 * @description Create a new user
 * @access Admin only
 */
router.post('/', validateBody(userCreateSchema), createUser);

/**
 * @route PUT /api/v1/users/:id
 * @description Update an existing user
 * @access Admin only
 */
router.put('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'User ID is required',
      type: 'User ID must be a number'
    }
  }
}), validateBody(userUpdateSchema), updateUser);

/**
 * @route DELETE /api/v1/users/:id
 * @description Delete a user
 * @access Admin only
 */
router.delete('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'User ID is required',
      type: 'User ID must be a number'
    }
  }
}), deleteUser);

/**
 * @route PATCH /api/v1/users/:id/status
 * @description Update user status (activate/deactivate)
 * @access Admin only
 */
router.patch('/:id/status', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'User ID is required',
      type: 'User ID must be a number'
    }
  }
}), validateBody({
  status: {
    type: 'string',
    required: true,
    enum: ['aktiv', 'inaktiv', 'gesperrt'],
    messages: {
      required: 'Status is required',
      enum: 'Status must be one of: aktiv, inaktiv, gesperrt'
    }
  }
}), updateUserStatus);

export default router;