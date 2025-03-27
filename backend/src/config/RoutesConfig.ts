import { Express } from 'express';
import { DiContainer } from '../core/DiContainer.js';
import { RouteManager } from '../routes/RouteManager.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';

/**
 * RoutesConfig
 * 
 * Configures and registers API routes for the application.
 * Replaces the previous implementation with the new RouteManager.
 */
export class RoutesConfig {
  private readonly routeManager: RouteManager;
  private readonly logger: ILoggingService;

  /**
   * Creates a new RoutesConfig instance
   * 
   * @param container - Dependency Injection container
   */
  constructor(container: DiContainer) {
    this.routeManager = new RouteManager(container);
    this.logger = container.resolve<ILoggingService>('LoggingService');
  }

  /**
   * Register all routes
   * 
   * @param app - Express application
   */
  public registerRoutes(app: Express): void {
    this.logger.info('Registering API routes with RouteManager...');
    this.routeManager.registerRoutes(app);
    this.logger.info('API routes registered successfully');
    this.logger.debug(`Registered routes: ${JSON.stringify(Object.keys(app._router.stack))}`);
  }
}

export default RoutesConfig;