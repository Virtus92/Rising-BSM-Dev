// tests/config/swagger.test.ts
import { setupSwagger } from '../../config/swagger';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from '../../config';
import { describe, test, expect, jest } from '@jest/globals';

// Mock swagger-jsdoc
jest.mock('swagger-jsdoc', () => jest.fn().mockReturnValue({}));

// Mock swagger-ui-express
jest.mock('swagger-ui-express', () => ({
  serve: [],
  setup: jest.fn()
}));

// Mock config
jest.mock('../../config', () => ({
  PORT: 5000,
  API_PREFIX: '/api/v1',
  NODE_ENV: 'development'
}));

// Mock console.log
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Swagger Configuration', () => {
  test('should initialize swagger-jsdoc with correct options', () => {
    // Call setupSwagger with a mock Express app
    const app = {
      use: jest.fn(),
      get: jest.fn()
    };
    
    setupSwagger(app);
    
    expect(swaggerJsdoc).toHaveBeenCalledWith(expect.objectContaining({
      definition: expect.objectContaining({
        openapi: '3.0.0',
        info: expect.any(Object),
        servers: expect.arrayContaining([
          expect.objectContaining({
            url: `http://localhost:${config.PORT}${config.API_PREFIX}`
          })
        ])
      })
    }));
  });
  
  test('should set up Swagger UI route', () => {
    const app = {
      use: jest.fn(),
      get: jest.fn()
    };
    
    setupSwagger(app);
    
    expect(app.use).toHaveBeenCalledWith('/api-docs', swaggerUi.serve, expect.any(Function));
  });
  
  test('should set up JSON spec route', () => {
    const app = {
      use: jest.fn(),
      get: jest.fn()
    };
    
    setupSwagger(app);
    
    expect(app.get).toHaveBeenCalledWith('/api-docs.json', expect.any(Function));
  });
  
  test('should log documentation URL', () => {
    const app = {
      use: jest.fn(),
      get: jest.fn()
    };
    
    setupSwagger(app);
    
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('/api-docs'));
  });
});