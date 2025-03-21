import { describe, test, expect, jest } from '@jest/globals';
import { Express } from 'express';

// Mock the swagger modules before importing the module under test
const mockSwaggerSpec = { openapi: '3.0.0', info: {}, paths: {} };

// Mock swagger-jsdoc
jest.mock('swagger-jsdoc', () => jest.fn(() => mockSwaggerSpec));

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

// Console.log mock to prevent output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Now import the module under test
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from '../../config';
import { setupSwagger } from '../../config/swagger';

describe('Swagger Configuration', () => {
  test('should initialize swagger-jsdoc with correct options', () => {
    // Create a properly typed mock Express app
    const app = {
      use: jest.fn(),
      get: jest.fn()
    } as unknown as Express;
    
    setupSwagger(app);
    
    expect(swaggerJsdoc).toHaveBeenCalledWith(expect.objectContaining({
      definition: expect.objectContaining({
        openapi: '3.0.0',
        info: expect.any(Object),
        servers: expect.arrayContaining([
          expect.objectContaining({
            url: expect.stringContaining(`${config.PORT}${config.API_PREFIX}`)
          })
        ])
      })
    }));
  });
  
  test('should set up Swagger UI route', () => {
    const app = {
      use: jest.fn(),
      get: jest.fn()
    } as unknown as Express;
    
    setupSwagger(app);
    
    // Just verify that use was called with the right path and serve
    expect(app.use).toHaveBeenCalledWith(
      '/api-docs',
      expect.anything(),  // swaggerUi.serve is mocked
      expect.any(Function)  // swaggerUi.setup is mocked
    );
  });
  
  test('should set up JSON spec route', () => {
    const app = {
      use: jest.fn(),
      get: jest.fn()
    } as unknown as Express;
    
    setupSwagger(app);
    
    expect(app.get).toHaveBeenCalledWith('/api-docs.json', expect.any(Function));
  });
  
  test('should log documentation URL', () => {
    const app = {
      use: jest.fn(),
      get: jest.fn()
    } as unknown as Express;
    
    setupSwagger(app);
    
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('/api-docs'));
  });
});