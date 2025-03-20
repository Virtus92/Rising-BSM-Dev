/**
 * Swagger/OpenAPI Configuration
 */
import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from './index';
import path from 'path';
import packageJson from '../package.json';

const { name, version, description } = packageJson;

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
  // Fix the type issue with swaggerUi.serve
  app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec));

  // Serve Swagger spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 API Documentation available at /api-docs`);
};

export default setupSwagger;