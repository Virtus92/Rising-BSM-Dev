import { Router } from 'express';
import { container } from '../factories.js';
import { IProjectController } from '../interfaces/IProjectController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateSchema } from '../middleware/validateSchema.js';
import { 
  projectCreateValidationSchema, 
  projectUpdateValidationSchema,
  projectStatusUpdateValidationSchema,
  projectNoteValidationSchema
} from '../dtos/ProjectDtos.js';

// Create router
const router = Router();

// Resolve dependencies
const projectController = container.resolve<IProjectController>('projectController');

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, in_progress, completed, canceled]
 *         description: Filter by status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: integer
 *         description: Filter by service ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', authenticate(), projectController.getAllProjects);

/**
 * @swagger
 * /api/projects/search:
 *   get:
 *     summary: Search projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', authenticate(), projectController.searchProjects);

/**
 * @swagger
 * /api/projects/active:
 *   get:
 *     summary: Get active projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of projects to return
 *     responses:
 *       200:
 *         description: List of active projects
 */
router.get('/active', authenticate(), projectController.getActiveProjects);

/**
 * @swagger
 * /api/projects/statistics:
 *   get:
 *     summary: Get project statistics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project statistics
 */
router.get('/statistics', authenticate(), projectController.getProjectStatistics);

/**
 * @swagger
 * /api/projects/export:
 *   get:
 *     summary: Export projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *         description: Export format
 *     responses:
 *       200:
 *         description: Exported file
 */
router.get('/export', authenticate(), projectController.exportProjects);

/**
 * @swagger
 * /api/projects/customer/{customerId}:
 *   get:
 *     summary: Get projects by customer
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: List of customer projects
 */
router.get('/customer/:customerId', authenticate(), projectController.getProjectsByCustomer);

/**
 * @swagger
 * /api/projects/service/{serviceId}:
 *   get:
 *     summary: Get projects by service
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Service ID
 *     responses:
 *       200:
 *         description: List of service projects
 */
router.get('/service/:serviceId', authenticate(), projectController.getProjectsByService);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 */
router.get('/:id', authenticate(), projectController.getProjectById);

/**
 * @swagger
 * /api/projects/{id}/notes:
 *   get:
 *     summary: Get project notes
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project notes
 */
router.get('/:id/notes', authenticate(), projectController.getProjectNotes);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectCreate'
 *     responses:
 *       201:
 *         description: Created project
 */
router.post('/', authenticate(), validateSchema(projectCreateValidationSchema), projectController.createProject);

/**
 * @swagger
 * /api/projects/{id}/notes:
 *   post:
 *     summary: Add note to project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note added
 */
router.post('/:id/notes', authenticate(), validateSchema(projectNoteValidationSchema), projectController.addProjectNote);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectUpdate'
 *     responses:
 *       200:
 *         description: Updated project
 */
router.put('/:id', authenticate(), validateSchema(projectUpdateValidationSchema), projectController.updateProject);

/**
 * @swagger
 * /api/projects/{id}/status:
 *   patch:
 *     summary: Update project status
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, in_progress, completed, canceled]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated project status
 */
router.patch('/:id/status', authenticate(), validateSchema(projectStatusUpdateValidationSchema), projectController.updateProjectStatus);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Deleted project
 */
router.delete('/:id', authenticate(), projectController.deleteProject);

export default router;
