import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import express from 'express';
import { logger } from '../utils/common.utils.js';

// Get the directory name equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug flag can be enabled with environment variable
const DEBUG = process.env.DEBUG_SWAGGER === 'true';

// Interface for OpenAPI spec
interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: {
    url: string;
    description?: string;
  }[];
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    responses?: Record<string, any>;
    securitySchemes?: Record<string, any>;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Try to find the OpenAPI bundle in various locations
 */
function findBundledSpec(): OpenApiSpec | null {
  const possiblePaths = [
    path.join(process.cwd(), 'dist/swagger.json'),
    path.join(process.cwd(), 'backend/dist/swagger.json'),
    path.join(__dirname, '..', 'dist/swagger.json'),
    path.join(__dirname, '..', '..', 'dist/swagger.json'),
    '/app/dist/swagger.json'
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        logger.info(`Found bundled OpenAPI spec at: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content) as OpenApiSpec;
      } catch (error) {
        logger.error(`Error reading bundled spec at ${filePath}:`, error);
      }
    }
  }

  return null;
}

/**
 * Create a basic OpenAPI specification when no files are found
 */
function createMockOpenApiSpec(): OpenApiSpec {
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
          summary: "Health check",
          description: "Check if the API is running",
          responses: {
            "200": {
              description: "API is running",
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

/**
 * Setup Swagger UI middleware 
 */
export function setupSwagger(app: express.Application, options: any = {}): void {
  logger.info('Setting up Swagger UI documentation...');
  
  // Check if Swagger is enabled (default to enabled)
  const isSwaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';
  
  // Skip setup if Swagger is disabled
  if (!isSwaggerEnabled) {
    logger.info('Swagger documentation disabled');
    return;
  }
  
  // Load bundled spec or use mock
  const openApiSpec = findBundledSpec() || createMockOpenApiSpec();
  
  // Log spec information
  const pathCount = Object.keys(openApiSpec.paths || {}).length;
  const schemaCount = Object.keys(openApiSpec.components?.schemas || {}).length;
  logger.info(`OpenAPI spec loaded with ${pathCount} paths and ${schemaCount} schemas`);
  
  // Default Swagger UI options
  const defaultOptions = {
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
      spec: openApiSpec
    }
  };
  
  // Merge options
  const uiOptions = { ...defaultOptions, ...options };
  
  // Register routes for the bundled spec and schemas
  // This gives direct access to individual schemas which helps with debugging
  app.get('/api-docs/swagger.json', (req, res) => {
    res.json(openApiSpec);
  });
  
  try {
    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(null, uiOptions));
    logger.info('Swagger UI documentation enabled at /api-docs');
  }
  catch (error) {
    logger.error('Error setting up Swagger UI:', error);
  }
}

export default setupSwagger;