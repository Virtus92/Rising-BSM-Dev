import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuthRoutes } from '../../src/routes/auth.routes.js';
import { AuthController } from '../../src/controllers/AuthController.js';
import { AuthMiddleware } from '../../src/middleware/AuthMiddleware.js';
import { ValidationMiddleware } from '../../src/middleware/ValidationMiddleware.js';
import { AuthService } from '../../src/services/AuthService.js';
import { ErrorHandler } from '../../src/core/ErrorHandler.js';
import { LoggingService } from '../../src/core/LoggingService.js';
import { ValidationService } from '../../src/core/ValidationService.js';
import { UserRepository } from '../../src/repositories/UserRepository.js';
import { RefreshTokenRepository } from '../../src/repositories/RefreshTokenRepository.js';
import config from '../../src/config/index.js';

/**
 * Creates and configures a test Express server
 * with all required dependencies for testing
 */
export function createTestServer(): {
  app: Express;
  prisma: PrismaClient;
  authService: AuthService;
} {
  // Create Express app
  const app = express();
  app.use(express.json());
  
  // Create Prisma client
  const prisma = new PrismaClient();
  
  // Create services and controllers
  const logger = new LoggingService();
  const errorHandler = new ErrorHandler(logger);
  const validationService = new ValidationService();
  const userRepository = new UserRepository(prisma);
  const refreshTokenRepository = new RefreshTokenRepository(prisma);
  
  const authService = new AuthService(
    userRepository,
    refreshTokenRepository,
    logger,
    validationService,
    errorHandler
  );
  
  const authController = new AuthController(
    authService,
    logger,
    errorHandler
  );
  
  const authMiddleware = new AuthMiddleware(
    errorHandler,
    logger,
    config.JWT_SECRET
  );
  
  // Register routes
  const authRoutes = createAuthRoutes(
    authController,
    authMiddleware,
    validationService,
    errorHandler
  );
  
  app.use(config.API_PREFIX, authRoutes);
  
  // Error handler middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      statusCode,
      errors: err.errors || [],
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  });
  
  return { app, prisma, authService };
}

/**
 * Helper to make authenticated requests
 */
export async function authenticatedRequest(
  app: Express,
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  token: string,
  body?: any
) {
  const req = request(app)[method](url)
    .set('Authorization', `Bearer ${token}`);
    
  if (body) {
    req.send(body);
  }
  
  return req;
}

export default createTestServer;