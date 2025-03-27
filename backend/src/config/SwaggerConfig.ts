/**
 * SwaggerConfig
 * 
 * Configures Swagger UI for API documentation with improved CORS and URL handling.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Express, Request, Response, NextFunction } from 'express';
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
   * Setup Swagger UI middleware with proper CORS handling
   * 
   * @param app - Express application
   */
  public setupSwagger(app: Express): void {
    if (!this.swaggerEnabled) {
      this.logger.info('Swagger UI is disabled');
      return;
    }

    this.logger.info('Setting up Swagger UI with enhanced configuration');
    
    try {
      // Find and load OpenAPI spec
      this.openApiSpec = this.findBundledSpec();

      // Ensure direct file access for Swagger JSON
      const swaggerJsonPath = path.join(__dirname, '../../dist/swagger.json');
      if (!fs.existsSync(path.dirname(swaggerJsonPath))) {
        fs.mkdirSync(path.dirname(swaggerJsonPath), { recursive: true });
      }
      
      // Write the OpenAPI spec to file to ensure it's always available
      fs.writeFileSync(
        swaggerJsonPath,
        JSON.stringify(this.openApiSpec),
        'utf8'
      );
      
      // Allow CORS specifically for Swagger-related endpoints
      app.use('/swagger.json', (req: Request, res: Response, next: NextFunction) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
      });

      // Serve the bundled Swagger JSON file
      app.use('/swagger.json', express.static(swaggerJsonPath));
      
      // Configure Swagger UI with improved options
      const options = {
        swaggerOptions: {
          url: '/swagger.json',
          // Configure fetch options to avoid CORS issues
          responseInterceptor: (res: any) => {
            // JavaScript function as string that will be injected into Swagger UI
            return `
              if (res.status >= 400) {
                console.error('Swagger UI API request failed:', res);
              }
              return res;
            `;
          },
          // Add proper request handling
          requestInterceptor: (req: any) => {
            // JavaScript function as string that will be injected into Swagger UI
            return `
              console.log('Swagger UI sending request:', req);
              // Ensure proper headers
              if (!req.headers) req.headers = {};
              req.headers['Accept'] = 'application/json';
              req.headers['Content-Type'] = 'application/json';
              return req;
            `;
          },
          // Set Swagger UI to use standard fetch with credentials
          withCredentials: true,
          supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'],
        },
        // Custom CSS to improve UI
        customCss: '.swagger-ui .topbar { display: none }',
        // Custom JS to fix potential issues
        customJs: '/swagger-custom.js'
      };
      
      // Add custom JS file for Swagger UI fixes
      const swaggerCustomJsPath = path.join(__dirname, '../../dist/swagger.js');
      const swaggerCustomJs = `
        // Fix for CORS and network issues in Swagger UI
        (function() {
          console.log('Swagger UI custom script loaded');
          
          // Override fetch with improved error handling
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            console.log('Fetch request:', url, options);
            
            // Add proper headers to avoid CORS issues
            if (!options) options = {};
            if (!options.headers) options.headers = {};
            options.headers['Accept'] = 'application/json';
            
            // For API requests, add Content-Type
            if (url.toString().includes('/api/')) {
              options.headers['Content-Type'] = 'application/json';
            }
            
            // Use proper mode
            options.mode = 'cors';
            options.credentials = 'include';
            
            return originalFetch(url, options)
              .then(response => {
                if (!response.ok) {
                  console.error('Fetch error:', response.status, response.statusText);
                }
                return response;
              })
              .catch(error => {
                console.error('Fetch error:', error);
                throw error;
              });
          };
          
          // Fix for CORS preflight handling
          document.addEventListener('DOMContentLoaded', function() {
            console.log('Swagger UI DOM loaded');
          });
        })();
      `;
      
      // Write custom JS file
      fs.writeFileSync(swaggerCustomJsPath, swaggerCustomJs, 'utf8');
      
      // Serve custom JS file
      app.use('/swagger-custom.js', express.static(swaggerCustomJsPath));
      
      // Configure Swagger UI
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, options));
      
      // Add health check for Swagger UI
      app.get('/api-docs/health', (req, res) => {
        res.json({ status: 'ok', message: 'Swagger UI is running' });
      });
      
      this.logger.info('Swagger UI configured successfully at /api-docs');
    } catch (error) {
      this.logger.error('Failed to set up Swagger UI:', error instanceof Error ? error : String(error));
    }
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