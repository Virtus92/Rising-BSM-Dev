/**
 * SwaggerCorsMiddleware
 * 
 * Specialized extension of EnhancedCorsMiddleware focused on Swagger UI
 * This middleware extends the core CORS middleware with Swagger-specific features.
 */
import { Express, Request, Response, NextFunction } from 'express';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { EnhancedCorsMiddleware } from './EnhancedCorsMiddleware.js';
import config from '../config/index.js';

export class SwaggerCorsMiddleware extends EnhancedCorsMiddleware {
  /**
   * Creates a new SwaggerCorsMiddleware instance
   * 
   * @param logger - Logging service
   */
  constructor(logger: ILoggingService) {
    super(logger, {
      // Swagger-specific CORS options
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'api_key'],
      credentials: true,
      preflightContinue: false
    });
    
    logger.debug('Initialized SwaggerCorsMiddleware');
  }

  /**
   * Apply CORS middleware specifically configured for Swagger UI
   * 
   * @param app - Express application
   */
  public override apply(app: Express): void {
    super.apply(app);
    
    // Add Swagger-specific routes and handlers
    if (config.IS_DEVELOPMENT) {
      app.get('/api/swagger-cors-test', (req: Request, res: Response) => {
        res.json({
          success: true,
          message: 'Swagger CORS is configured correctly',
          origin: req.headers.origin || 'No origin header',
          apiExplorer: true
        });
      });
    }
  }
}

export default SwaggerCorsMiddleware;