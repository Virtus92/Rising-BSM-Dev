import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { createRequire } from 'module';
import config from './index.js';
import { Application, Request, Response } from 'express';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Rising BSM API',
    version,
    description: 'API documentation for Rising Business Service Management',
    license: {
      name: 'Proprietary',
      url: 'https://your-company-website.com',
    },
    contact: {
      name: 'API Support',
      url: 'https://your-company-website.com/contact',
      email: 'support@your-company-email.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}${config.API_PREFIX}`,
      description: 'Development server',
    },
    {
      url: process.env.API_URL || `http://localhost:${config.PORT}${config.API_PREFIX}`,
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT Bearer token',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication operations',
    },
    {
      name: 'Users',
      description: 'User management operations',
    },
    {
      name: 'Customers',
      description: 'Customer management operations',
    },
    {
      name: 'Projects',
      description: 'Project management operations',
    },
    {
      name: 'Appointments',
      description: 'Appointment management operations',
    },
    {
      name: 'Services',
      description: 'Service management operations',
    },
    {
      name: 'Dashboard',
      description: 'Dashboard operations',
    },
    {
      name: 'Profile',
      description: 'User profile operations',
    },
    {
      name: 'Settings',
      description: 'System settings operations',
    },
    {
      name: 'Notifications',
      description: 'Notification operations',
    },
    {
      name: 'Requests',
      description: 'Contact request operations',
    }
  ],
};

// Swagger options
const options = {
  swaggerDefinition,
  // Path to the API docs
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './docs/**/*.yaml',
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Function to setup swagger UI
export const initSwaggerDocs = (app: Application): void => {
  // Swagger UI options
  const swaggerUiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Rising BSM API Documentation',
    customfavIcon: '/favicon.ico',
  };

  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Expose swagger docs as JSON
  app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`Swagger docs available at http://localhost:${config.PORT}/api-docs`);
};

export default swaggerSpec;