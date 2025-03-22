// In config/swagger.ts
import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import config from './index.js';

// Use __dirname directly if available, or process.cwd() as fallback
const PROJECT_ROOT = process.cwd();

// Load package.json for API information
let packageInfo;
try {
  const packagePath = join(PROJECT_ROOT, 'package.json');
  packageInfo = JSON.parse(readFileSync(packagePath, 'utf8'));
} catch (error) {
  console.error('Could not load package.json, using defaults');
  packageInfo = {
    name: 'Rising BSM API',
    version: '1.0.0',
    description: 'Business Service Management API'
  };
}

// Enhanced Swagger options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: packageInfo.name,
      version: packageInfo.version,
      description: packageInfo.description,
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'Rising BSM API Support',
        url: 'https://www.risingbsm.com',
        email: 'support@risingbsm.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}${config.API_PREFIX}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      examples: {
        UserLogin: {
          value: {
            email: "admin@example.com",
            password: "Password123!"
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],  // Default security requirement
  },
  apis: [
    join(PROJECT_ROOT, 'backend/routes/**/*.ts'),
    join(PROJECT_ROOT, 'backend/controllers/**/*.ts'),
    join(PROJECT_ROOT, 'backend/models/**/*.ts'),
    join(PROJECT_ROOT, 'swagger-definitions.ts')
  ]
};

// Add route documentation for authentication
const authRoutesSpec = {
  paths: {
    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login to get access token',
        description: 'Authenticates user and returns JWT tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  },
                  password: {
                    type: 'string',
                    format: 'password'
                  },
                  remember: {
                    type: 'boolean'
                  }
                }
              },
              example: {
                email: "admin@example.com",
                password: "Password123!",
                remember: true
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successful authentication',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    accessToken: {
                      type: 'string'
                    },
                    refreshToken: {
                      type: 'string'
                    },
                    expiresIn: {
                      type: 'number'
                    },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Authentication failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: false
                    },
                    error: {
                      type: 'string',
                      example: 'Invalid email or password'
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


/**
 * Configure Swagger documentation
 * @param app Express application
 */
export const setupSwagger = (app: Express): void => {
  // Generate swagger specification
  const swaggerSpec = swaggerJsdoc(swaggerOptions) as any;
  
  swaggerSpec.paths = {
    ...swaggerSpec.paths,
    ...authRoutesSpec.paths
  };
  
  // Configure and set up Swagger UI
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
    }
  };

  app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec, swaggerUiOptions) as any);

  // Serve Swagger spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 API Documentation available at /api-docs`);
};

export default setupSwagger;