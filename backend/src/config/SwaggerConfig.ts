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
  public setup(app: Express): void {
    if (!this.swaggerEnabled) {
      this.logger.info('Swagger documentation disabled');
      return;
    }
    
    this.logger.info('Setting up Swagger UI documentation...');
    
    try {
      // Load bundled spec
      this.openApiSpec = this.findBundledSpec();
      
      // Log spec information
      const pathCount = Object.keys(this.openApiSpec?.paths || {}).length;
      const schemaCount = Object.keys(this.openApiSpec?.components?.schemas || {}).length;
      this.logger.info(`OpenAPI spec loaded with ${pathCount} paths and ${schemaCount} schemas`);
      
      // Register route for the bundled spec
      app.get('/api-docs/swagger.json', (_req, res) => {
        res.json(this.openApiSpec);
      });
      
      // Default Swagger UI options
      const uiOptions = {
        explorer: true,
        customCss: `
          .swagger-ui .topbar { display: none }
          .swagger-ui .opblock-body pre.microlight { max-height: 500px; overflow-y: auto; }
          .swagger-ui .opblock-description-wrapper p, .swagger-ui .opblock-external-docs-wrapper p, .swagger-ui .opblock-title_normal p { font-size: 14px }
        `,
        swaggerOptions: {
          persistAuthorization: true,
          docExpansion: 'list',
          defaultModelsExpandDepth: 3,
          defaultModelExpandDepth: 3,
          tryItOutEnabled: true,
          spec: this.openApiSpec
        }
      };
      
      // Serve Swagger UI
      app.use('/api-docs', swaggerUi.serve);
      app.get('/api-docs', swaggerUi.setup(null, uiOptions));
      
      this.logger.info('Swagger UI documentation enabled at /api-docs');
    } catch (error) {
      this.logger.error('Error setting up Swagger UI:', error instanceof Error ? error : String(error));
    }
  }

  /**
   * Find bundled OpenAPI specification
   * 
   * @returns OpenAPI specification or mock specification
   */
  private findBundledSpec(): any {
    const possiblePaths = [
      path.resolve(process.cwd(), 'dist/swagger.json'),
      path.resolve(process.cwd(), 'backend/dist/swagger.json'),
      path.resolve(__root, '../dist/swagger.json'),
      path.resolve(__root, '../../dist/swagger.json'),
      '/app/dist/swagger.json'
    ];

    console.log(possiblePaths);
    
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
    
    // Wenn die bundled Spec nicht gefunden werden kann, suchen wir nach der source spec
    const sourcePaths = [
      path.resolve(process.cwd(), '../openapi/openapi.yaml'),
      path.resolve(__dirname, '../openapi/openapi.yaml'),
      '/app/openapi/openapi.yaml'
    ];
    
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
    
    // Fallback zur Mock-Spezifikation
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