import { Router } from 'express';
import { IServiceController } from '../interfaces/IServiceController.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  serviceCreateValidationSchema, 
  serviceUpdateValidationSchema,
  serviceStatusUpdateValidationSchema
} from '../dtos/ServiceDtos.js';

/**
 * Create the service routes
 * 
 * @param controller - Service controller
 * @param validationService - Service for validating request data
 * @param auth - Authentication middleware
 * @param errorHandler - Service for handling errors
 * @returns Router
 */
export function createServiceRoutes(
  controller: IServiceController,
  validationService: IValidationService,
  auth: AuthMiddleware,
  errorHandler: IErrorHandler
): Router {
  const router = Router();
  const validate = new ValidationMiddleware(validationService, errorHandler);
  
  // Get all services (paginated and filtered)
  router.get('/', 
    auth.authenticate(), 
    controller.getAllServices.bind(controller)
  );
  
  // Get service by ID
  router.get('/:id', 
    auth.authenticate(), 
    controller.getServiceById.bind(controller)
  );
  
  // Get service statistics
  router.get('/:id/statistics', 
    auth.authenticate(), 
    auth.authorize('admin', 'manager'), 
    controller.getServiceStatistics.bind(controller)
  );
  
  // Create a new service
  router.post('/', 
    auth.authenticate(), 
    auth.authorize('admin', 'manager'), 
    validate.validate(serviceCreateValidationSchema),
    controller.createService.bind(controller)
  );
  
  // Update an existing service
  router.put('/:id', 
    auth.authenticate(), 
    auth.authorize('admin', 'manager'), 
    validate.validate(serviceUpdateValidationSchema),
    controller.updateService.bind(controller)
  );
  
  // Toggle service status
  router.patch('/:id/status', 
    auth.authenticate(), 
    auth.authorize('admin', 'manager'), 
    validate.validate(serviceStatusUpdateValidationSchema),
    controller.toggleServiceStatus.bind(controller)
  );
  
  return router;
}