/**
 * SwaggerConfig
 * 
 * Configures Swagger UI for API documentation.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import express from 'express';

// Get the directory name equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __root = path.resolve(__dirname, '../..');

export class SwaggerConfig {
  private readonly swaggerEnabled: boolean;
  private openApiSpec: any;
  
  /**
   * Creates a new SwaggerConfig instance
   * 
   * @param logger - Logging service
   */
  constructor(private readonly logger: ILoggingService) {
    this.swaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';
    this.logger.debug('Initialized SwaggerConfig');
  }

  /**
   * Setup Swagger UI middleware
   * 
   * @param app - Express application
   */
  private setupSwagger(app: Express): void {
    if (!this.swaggerEnabled) {
      this.logger.info('Swagger UI is disabled');
      return;
    }

    // Serve the bundled Swagger JSON file
    app.use('/swagger.json', express.static(path.join(__dirname, '../../dist/swagger.json')));
    
    // Configure Swagger UI to use the bundled file
    const options = {
      swaggerOptions: {
        url: '/swagger.json',
      },
    };
    
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, options));
  }

  /**
   * Find bundled OpenAPI specification
   * 
   * @returns OpenAPI specification or mock specification
   */
  private findBundledSpec(): any {
    const possiblePaths = [
      '/app/dist/swagger.json',  // Prioritize container path
      path.resolve(process.cwd(), 'dist/swagger.json'),
      path.resolve(__root, 'dist/swagger.json'),
      path.resolve(__root, '../dist/swagger.json'),
      path.resolve(process.cwd(), 'backend/dist/swagger.json'),
      path.resolve(__root, '../../dist/swagger.json')
    ];

    this.logger.debug('Looking for bundled OpenAPI spec at:', possiblePaths);
    
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        try {
          this.logger.info(`Found bundled OpenAPI spec at: ${filePath}`);
          const content = fs.readFileSync(filePath, 'utf8');
          return JSON.parse(content);
        } catch (error) {
          this.logger.error(`Error reading bundled spec at ${filePath}:`, error instanceof Error ? error : String(error));
        }
      }
    }
    
    // If bundled spec cannot be found, look for source spec
    const sourcePaths = [
      '/app/openapi/openapi.yaml',  // Prioritize container path
      path.resolve(process.cwd(), 'openapi/openapi.yaml'),
      path.resolve(__dirname, '../openapi/openapi.yaml'),
      path.resolve(process.cwd(), '../openapi/openapi.yaml')
    ];
    
    this.logger.debug('Looking for source OpenAPI spec at:', sourcePaths);
    
    for (const filePath of sourcePaths) {
      if (fs.existsSync(filePath)) {
        this.logger.info(`Found source OpenAPI spec at: ${filePath}`);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const spec = yaml.load(content);
          return spec;
        } catch (error) {
          this.logger.error(`Error reading source spec at ${filePath}:`, error instanceof Error ? error : String(error));
        }
      }
    }
    
    // Fallback to mock specification
    this.logger.warn('No OpenAPI spec found, using mock specification');
    return this.createMockOpenApiSpec();
  }

  /**
   * Create a mock OpenAPI specification
   * 
   * @returns Mock OpenAPI specification
   */
  private createMockOpenApiSpec(): any {
    return {
      openapi: "3.0.0",
      info: {
        title: "Rising BSM API",
        version: "1.0.0",
        description: "Backend API for Rising Business Service Management.\n\nPlease note: The full OpenAPI specification could not be loaded. This is a simplified version."
      },
      servers: [
        {
          url: "/api/v1",
          description: "Local API server"
        }
      ],
      paths: {
        "/health": {
          get: {
            summary: "Health check endpoint",
            description: "Check if the API is running",
            responses: {
              "200": {
                description: "API is operational",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        status: {
                          type: "string",
                          example: "ok"
                        },
                        timestamp: {
                          type: "string",
                          format: "date-time"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }
}