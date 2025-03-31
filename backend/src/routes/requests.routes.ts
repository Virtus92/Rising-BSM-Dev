import { Router } from 'express';
import { RequestController } from '../controllers/RequestController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { UserRole } from '../entities/User.js';
import rateLimit from 'express-rate-limit';

/**
 * Create request routes
 * 
 * @param requestController - Request management controller
 * @param authMiddleware - Authentication middleware
 * @param validationService - Service for validating request data
 * @param errorHandler - Service for handling errors
 * @returns Configured router for request endpoints
 */
export function createRequestRoutes(
  requestController: RequestController, 
  authMiddleware: AuthMiddleware,
  validationService: IValidationService,
  errorHandler: IErrorHandler
): Router {
  const router = Router();
  const validationMiddleware = new ValidationMiddleware(validationService, errorHandler);

  // Middleware configurations
  const adminOnlyAccess = [
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN])
  ];

  // Rate limiter for public contact endpoint to prevent abuse
  const contactFormLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour
    message: {
      success: false,
      error: 'Too many requests',
      message: 'You have exceeded the rate limit for contact requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Public contact form endpoint with rate limiting
  router.post('/public',
    contactFormLimiter,
    requestController.submitRequest
  );

  // Admin routes for managing contact requests
  router.get('/',
    ...adminOnlyAccess,
    requestController.getAllRequests
  );

  // Export route (must come before :id routes to avoid path conflicts)
  router.get('/export',
    ...adminOnlyAccess,
    requestController.exportRequests
  );

  // Batch operations
  router.patch('/batch/status',
    ...adminOnlyAccess,
    requestController.batchUpdateRequestStatus
  );

  // Single item routes with :id parameter
  router.get('/:id',
    ...adminOnlyAccess,
    requestController.getRequestById
  );

  router.patch('/:id/status',
    ...adminOnlyAccess,
    requestController.updateRequestStatus
  );

  router.post('/:id/notes',
    ...adminOnlyAccess,
    requestController.addRequestNote
  );

  router.patch('/:id/assign',
    ...adminOnlyAccess,
    requestController.assignRequest
  );

  return router;
}