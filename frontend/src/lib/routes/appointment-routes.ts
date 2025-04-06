import { Router } from 'express';
import { IAppointmentController } from '../interfaces/IAppointmentController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { UserRole } from '../entities/User.js';
import { 
  appointmentCreateValidationSchema, 
  appointmentUpdateValidationSchema,
  appointmentStatusUpdateValidationSchema,
  appointmentNoteValidationSchema
} from '../dtos/AppointmentDtos.js';

/**
 * Configure appointment routes
 * 
 * @param appointmentController - Appointment controller
 * @param authMiddleware - Authentication and authorization middleware
 * @param validationService - Service for validating request data
 * @param errorHandler - Service for handling errors
 * @returns Configured router for appointment endpoints
 */
export function createAppointmentRoutes(
  appointmentController: IAppointmentController,
  authMiddleware: AuthMiddleware,
  validationService: IValidationService,
  errorHandler: IErrorHandler
): Router {
  const router = Router();
  const validationMiddleware = new ValidationMiddleware(validationService, errorHandler);

  // Middleware configurations
  const standardAccess = [
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE])
  ];

  const managerAndAdminAccess = [
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER])
  ];

  // Main appointment endpoints
  router.get('/', 
    ...standardAccess, 
    appointmentController.findAppointments
  );
  
  router.post('/', 
    ...standardAccess,
    validationMiddleware.validate(appointmentCreateValidationSchema),
    appointmentController.create
  );
  
  // Get upcoming appointments
  router.get('/upcoming', 
    ...standardAccess, 
    appointmentController.getUpcoming
  );
  
  // Single appointment endpoints
  router.get('/:id', 
    ...standardAccess, 
    appointmentController.getById
  );
  
  router.get('/:id/details', 
    ...standardAccess, 
    appointmentController.getDetails
  );
  
  router.put('/:id', 
    ...standardAccess,
    validationMiddleware.validate(appointmentUpdateValidationSchema),
    appointmentController.update
  );
  
  router.delete('/:id', 
    ...managerAndAdminAccess, 
    appointmentController.delete
  );
  
  // Status update endpoint
  router.patch('/:id/status', 
    ...standardAccess,
    validationMiddleware.validate(appointmentStatusUpdateValidationSchema),
    appointmentController.updateStatus
  );
  
  // Notes endpoints
  router.get('/:id/notes', 
    ...standardAccess, 
    appointmentController.getNotes
  );
  
  router.post('/:id/notes', 
    ...standardAccess,
    validationMiddleware.validate(appointmentNoteValidationSchema),
    appointmentController.addNote
  );
  
  return router;
}

/**
 * Legacy wrapper function for configureAppointmentRoutes
 * This is kept for backwards compatibility
 */
export function configureAppointmentRoutes(
  appointmentController: IAppointmentController,
  authMiddleware: AuthMiddleware,
  validationService: IValidationService,
  errorHandler: IErrorHandler
): Router {
  return createAppointmentRoutes(
    appointmentController,
    authMiddleware,
    validationService,
    errorHandler
  );
}
