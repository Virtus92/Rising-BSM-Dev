import { Router } from 'express';
import { ContactController } from '../controllers/ContactController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { UserRole } from '../entities/User.js';
import rateLimit from 'express-rate-limit';

/**
 * Create contact routes
 * 
 * @param contactController - Contact management controller
 * @param authMiddleware - Authentication middleware
 * @param validationService - Service for validating request data
 * @param errorHandler - Service for handling errors
 * @returns Configured router for contact endpoints
 */
export function createContactRoutes(
  contactController: ContactController, 
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
    contactController.submitContactRequest
  );

  // Admin routes for managing contact requests
  router.get('/',
    ...adminOnlyAccess,
    contactController.getAllContactRequests
  );

  router.get('/:id',
    ...adminOnlyAccess,
    contactController.getContactRequestById
  );

  router.patch('/:id/status',
    ...adminOnlyAccess,
    contactController.updateContactRequestStatus
  );

  router.post('/:id/notes',
    ...adminOnlyAccess,
    contactController.addContactRequestNote
  );

  return router;
}