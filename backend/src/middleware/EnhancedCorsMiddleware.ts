import cors from 'cors';
import { Express, Request, Response, NextFunction } from 'express';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import config from '../config/index.js';

/**
 * EnhancedCorsMiddleware
 * 
 * Enhanced CORS middleware that includes:
 * - Better error handling
 * - Debug information
 * - Support for multiple environments
 * - Support for Swagger UI requests
 * - Automatic detection of request origins
 */
export class EnhancedCorsMiddleware {
  private corsOptions: cors.CorsOptions;
  
  constructor(
    private readonly logger: ILoggingService,
    options?: Partial<cors.CorsOptions>
  ) {
    // Load origins from config
    const configuredOrigins = config.CORS_ORIGINS;
    
    this.corsOptions = {
      // Default origins from config
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) {
          this.logger.debug('CORS: Request has no origin, allowing request');
          return callback(null, true);
        }
        
        // Check if the origin is allowed
        if (configuredOrigins.indexOf(origin) !== -1 || configuredOrigins.includes('*')) {
          this.logger.debug(`CORS: Origin ${origin} is allowed`);
          return callback(null, true);
        } else {
          // Special case for development with different ports
          if (config.IS_DEVELOPMENT) {
            // In dev mode, allow localhost regardless of port
            if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
              this.logger.debug(`CORS: Allowing localhost origin in dev mode: ${origin}`);
              return callback(null, true);
            }
          }
          
          // Log rejected origins in production for monitoring
          if (config.IS_PRODUCTION) {
            this.logger.warn(`CORS: Origin ${origin} is not allowed`);
          }
          
          return callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      credentials: true,
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204,
      ...options // Override with custom options if provided
    };
  }

  /**
   * Apply CORS middleware to Express app
   * 
   * @param app - Express application
   */
  public apply(app: Express): void {
    if (!config.CORS_ENABLED) {
      this.logger.warn('CORS is disabled. This might cause issues with browser-based clients.');
      return;
    }
    
    this.logger.info(`Applying CORS middleware with allowed origins: ${config.CORS_ORIGINS.join(', ')}`);
    
    // Handle OPTIONS preflight requests first
    app.options('*', (req: Request, res: Response) => {
      const origin = req.headers.origin || '';
      this.setCorsHeaders(res, origin);
      res.status(204).end();
    });
    
    // Apply regular CORS middleware
    app.use(cors(this.corsOptions));
    
    // Add special handling for Swagger UI requests
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (this.isSwaggerUIRequest(req)) {
        this.logger.debug('Detected Swagger UI request, ensuring CORS headers');
        this.setCorsHeaders(res, req.headers.origin || '');
      }
      next();
    });
    
    // Add diagnostic endpoint for CORS issues
    if (config.IS_DEVELOPMENT) {
      app.get('/api/cors-test', (req: Request, res: Response) => {
        res.json({
          success: true,
          message: 'CORS is configured correctly',
          origin: req.headers.origin || 'No origin header',
          forwardedHost: req.headers['x-forwarded-host'] || 'No forwarded host',
          host: req.headers.host || 'No host header'
        });
      });
    }
    
    // Add error handler for CORS errors
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (err.message && err.message.includes('not allowed by CORS')) {
        this.logger.warn(`CORS Error: ${err.message}`, {
          origin: req.headers.origin,
          method: req.method,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          message: 'CORS Error: Access not allowed from this origin',
          error: 'cors_error',
          allowedOrigins: config.CORS_ORIGINS
        });
      }
      
      // Pass to next error handler if not a CORS error
      next(err);
    });
  }
  
  /**
   * Check if a request is from Swagger UI
   * 
   * @param req - HTTP request
   * @returns Whether request is from Swagger UI
   */
  private isSwaggerUIRequest(req: Request): boolean {
    // Check for Swagger UI specific patterns
    
    // 1. Check referer header for api-docs
    const referer = req.headers.referer || '';
    if (referer.includes('/api-docs')) {
      return true;
    }
    
    // 2. Check for swagger UI specific user agent or custom header
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.includes('swagger')) {
      return true;
    }
    
    // 3. Check if the request path is for Swagger UI resources
    if (req.path.startsWith('/api-docs') || req.path.startsWith('/swagger')) {
      return true;
    }
    
    // 4. Check for requests to the API from the same host (likely from Swagger UI)
    const host = req.headers.host || '';
    const origin = req.headers.origin || '';
    if (origin.includes(host) && req.path.startsWith('/api/')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Set CORS headers on response
   * 
   * @param res - HTTP response
   * @param origin - Request origin
   */
  private setCorsHeaders(res: Response, origin: string): void {
    // If specific origin is provided and it's allowed, use it
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      // Otherwise, use the first allowed origin or * for development
      res.header('Access-Control-Allow-Origin', config.IS_DEVELOPMENT ? '*' : config.CORS_ORIGINS[0] || '*');
    }
    
    // Set other CORS headers
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
  }
}

export default EnhancedCorsMiddleware;