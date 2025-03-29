/**
 * SwaggerConfig (Test Version)
 * 
 * This is a simplified version of SwaggerConfig for testing purposes.
 * It avoids using import.meta which can cause issues in tests.
 */
import { Express } from 'express';
import { ILoggingService } from '../interfaces/ILoggingService.js';

// Test mock version of SwaggerConfig
export class SwaggerConfig {
  private readonly swaggerEnabled: boolean;
  
  /**
   * Creates a new SwaggerConfig instance
   * 
   * @param logger - Logging service
   */
  constructor(private readonly logger: ILoggingService) {
    this.swaggerEnabled = false; // Always disabled in tests
    this.logger.debug('Initialized Test SwaggerConfig');
  }

  /**
   * Setup Swagger UI middleware (no-op in test environment)
   * 
   * @param app - Express application
   */
  public setupSwagger(app: Express): void {
    this.logger.info('Swagger UI is disabled in test environment');
    return;
  }
}
