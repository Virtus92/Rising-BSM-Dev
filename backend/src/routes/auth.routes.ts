import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  loginValidation, 
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation 
} from '../dtos/auth.dto.js';
export function createAuthRoutes(
  authController: AuthController, 
  authMiddleware: AuthMiddleware,
  validationService: IValidationService,
  errorHandler: IErrorHandler
): Router {
  const router = Router();
  const validationMiddleware = new ValidationMiddleware(validationService, errorHandler);
  // Public routes (no authentication required)
  router.post('/login', 
    validationMiddleware.validate(loginValidation),
    authController.login
  );
  router.post('/auth/refresh-token', 
    validationMiddleware.validate(refreshTokenValidation),
    authController.refreshToken
  );

  router.post('/auth/forgot-password', 
    validationMiddleware.validate(forgotPasswordValidation),
    authController.forgotPassword
  );

  router.get('/auth/reset-token/:token', 
    authController.validateResetToken
  );
  router.post('/auth/reset-password/:token', 
    validationMiddleware.validate(resetPasswordValidation),
    authController.resetPassword
  );

  // Protected routes (require authentication)
  router.post('/auth/logout', 
    authMiddleware.authenticate(),
    authController.logout
  );

  // Development-only routes
  if (process.env.NODE_ENV === 'development') {
    router.get('/auth/dev/reset-token', 
      authController.getResetToken
    );
  }

  return router;
}