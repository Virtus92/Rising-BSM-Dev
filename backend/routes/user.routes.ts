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
  updateUserStatus,
  searchUsers,
  getUserStatistics,
  exportUsers,
  bulkUpdateUsers
} from '../controllers/user.controller.js';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../middleware/validation.middleware.js';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';
import {
  userCreateValidation,
  userUpdateValidation,
  UserStatus
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
router.get('/', validateQuery({
  ...commonSchemas.pagination,
  ...commonSchemas.search,
  ...commonSchemas.sort,
  ...commonSchemas.dateRange,
  status: {
    type: 'string',
    required: false,
    enum: Object.values(UserStatus)
  },
  role: {
    type: 'string',
    required: false,
    enum: ['admin', 'manager', 'employee', 'user']
  }
}), getAllUsers);

/**
 * @route GET /api/v1/users/search
 * @description Search users with term
 * @access Admin only
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
}), searchUsers);

/**
 * @route GET /api/v1/users/statistics
 * @description Get user statistics
 * @access Admin only
 */
router.get('/statistics', getUserStatistics);

/**
 * @route GET /api/v1/users/export
 * @description Export users data
 * @access Admin only
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
  role: {
    type: 'string',
    required: false
  }
}), exportUsers);

/**
 * @route POST /api/v1/users/bulk-update
 * @description Update multiple users at once
 * @access Admin only
 */
router.post('/bulk-update', validateBody({
  userIds: {
    type: 'array' as const,
    required: true,
    items: {
      type: 'number' as const
    },
    messages: {
      required: 'User IDs are required',
      type: 'User IDs must be provided as an array'
    }
  },
  data: {
    type: 'object' as const,
    required: true,
    schema: userUpdateValidation,
    messages: {
      required: 'Update data is required',
      type: 'Update data must be an object'
    }
  }
}), bulkUpdateUsers);

/**
 * @route GET /api/v1/users/:id
 * @description Get user by ID
 * @access Admin only
 */
router.get('/:id', validateParams(commonSchemas.idParam), getUserById);

/**
 * @route POST /api/v1/users
 * @description Create a new user
 * @access Admin only
 */
router.post('/', validateBody(userCreateValidation), createUser);

/**
 * @route PUT /api/v1/users/:id
 * @description Update an existing user
 * @access Admin only
 */
router.put('/:id', validateParams(commonSchemas.idParam), validateBody(userUpdateValidation), updateUser);

/**
 * @route DELETE /api/v1/users/:id
 * @description Delete a user
 * @access Admin only
 */
router.delete('/:id', validateParams(commonSchemas.idParam), deleteUser);

/**
 * @route PATCH /api/v1/users/:id/status
 * @description Update user status (activate/deactivate)
 * @access Admin only
 */
router.patch('/:id/status', validateParams(commonSchemas.idParam), validateBody({
  status: {
    type: 'enum' as const,
    required: true,
    enum: Object.values(UserStatus),
    messages: {
      required: 'Status is required',
      enum: `Status must be one of: ${Object.values(UserStatus).join(', ')}`
    }
  },
  note: {
    type: 'string',
    required: false,
    maxLength: 1000,
    messages: {
      maxLength: 'Note must not exceed 1000 characters'
    }
  }
}), updateUserStatus);

export default router;