/**
 * Swagger/OpenAPI Configuration
 */
import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from './index';
import path from 'path';

// Try to load package.json but handle if it's not available
let packageInfo = { name: 'Rising BSM API', version: '1.0.0', description: 'Business Service Management API' };
try {
  // This might fail in tests
  packageInfo = require('../package.json');
} catch (error) {
  console.error('Could not load package.json, using defaults');
}

const { name, version, description } = packageInfo;

// Define Swagger options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: name,
      version,
      description,
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
      {
        url: `https://api.risingbsm.com${config.API_PREFIX}`,
        description: 'Production server',
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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../controllers/*.ts'),
    path.join(__dirname, '../models/*.ts'),
  ],
};

/**
 * Configure Swagger documentation
 * @param app Express application
 */
export const setupSwagger = (app: Express): void => {
  // Generate swagger specification
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  
  // Fix the type issue with swaggerUi.serve by using 'as any'
  app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec));

  // Serve Swagger spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 API Documentation available at /api-docs`);
};

export default setupSwagger;