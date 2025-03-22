/**
 * Project Routes
 * 
 * Route definitions for Project entity operations with validation.
 */
import { Router } from 'express';
import { 
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  addProjectNote,
  getProjectStatistics,
  exportProjects
} from '../controllers/project.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  projectCreateSchema, 
  projectUpdateSchema, 
  projectStatusUpdateSchema 
} from '../types/dtos/project.dto.js';

// Create router
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/v1/projects
 * @description Get all projects with filtering and pagination
 * @access Private
 */
router.get('/', getAllProjects);

/**
 * @route GET /api/v1/projects/statistics
 * @description Get project statistics
 * @access Private
 */
router.get('/statistics', getProjectStatistics);

/**
 * @route GET /api/v1/projects/export
 * @description Export projects data
 * @access Private
 */
router.get('/export', exportProjects);

/**
 * @route GET /api/v1/projects/:id
 * @description Get project by ID with related data
 * @access Private
 */
router.get('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Project ID is required',
      type: 'Project ID must be a number'
    }
  }
}), getProjectById);

/**
 * @route POST /api/v1/projects
 * @description Create a new project
 * @access Private
 */
router.post('/', validateBody(projectCreateSchema), createProject);

/**
 * @route PUT /api/v1/projects/:id
 * @description Update an existing project
 * @access Private
 */
router.put('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Project ID is required',
      type: 'Project ID must be a number'
    }
  }
}), validateBody(projectUpdateSchema), updateProject);

/**
 * @route PATCH /api/v1/projects/:id/status
 * @description Update project status
 * @access Private
 */
router.patch('/:id/status', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Project ID is required',
      type: 'Project ID must be a number'
    }
  }
}), validateBody(projectStatusUpdateSchema), updateProjectStatus);

/**
 * @route POST /api/v1/projects/:id/notes
 * @description Add a note to project
 * @access Private
 */
router.post('/:id/notes', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Project ID is required',
      type: 'Project ID must be a number'
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
}), addProjectNote);

export default router;