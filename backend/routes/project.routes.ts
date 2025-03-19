import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import * as projectController from '../controllers/project.controller';
import { validateProject } from '../middleware/validation.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard/projekte
 * @desc    Display list of projects with optional filtering
 */
router.get('/', projectController.getAllProjects);

/**
 * @route   GET /dashboard/projekte/:id
 * @desc    Display project details
 */
router.get('/:id', projectController.getProjectById);

/**
 * @route   POST /dashboard/projekte/neu
 * @desc    Create a new project
 */
router.post('/neu', validateProject, projectController.createProject);

/**
 * @route   PUT /dashboard/projekte/:id
 * @desc    Update a project
 */
router.put('/:id', validateProject, projectController.updateProject);

/**
 * @route   POST /dashboard/projekte/update-status
 * @desc    Update project status
 */
router.post('/update-status', projectController.updateProjectStatus);

/**
 * @route   POST /dashboard/projekte/:id/notes
 * @desc    Add a note to a project
 */
router.post('/:id/notes', projectController.addProjectNote);

/**
 * @route   GET /dashboard/projekte/export
 * @desc    Export projects in various formats
 */
router.get('/export', projectController.exportProjects);

export default router;