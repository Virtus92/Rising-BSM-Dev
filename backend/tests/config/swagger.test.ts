import { describe, test, expect, jest } from '@jest/globals';
import { Express } from 'express';

// Mock the swagger modules before importing the module under test
const mockSwaggerSpec = { openapi: '3.0.0', info: {}, paths: {} };

// Mock swagger-jsdoc
jest.mock('swagger-jsdoc', () => jest.fn(() => mockSwaggerSpec));

// Mock swagger-ui-express
jest.mock('swagger-ui-express', () => ({
  serve: [],
  setup: jest.fn().mockReturnValue(jest.fn())
}));

jest.mock('../../package.json', () => {
  throw new Error('Could not load package.json');
}, { virtual: true });

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

  test('should configure security schemes correctly', () => {
    const app = {
      use: jest.fn(),
      get: jest.fn()
    } as unknown as Express;
    
    setupSwagger(app);
    
    expect(swaggerJsdoc).toHaveBeenCalledWith(expect.objectContaining({
      definition: expect.objectContaining({
        components: expect.objectContaining({
          securitySchemes: expect.objectContaining({
            bearerAuth: expect.objectContaining({
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            })
          })
        }),
        security: expect.arrayContaining([
          expect.objectContaining({
            bearerAuth: expect.any(Array)
          })
        ])
      })
    }));
  });

  test('should configure API paths pattern correctly', () => {
    const app = {
      use: jest.fn(),
      get: jest.fn()
    } as unknown as Express;
    
    setupSwagger(app);
    
    expect(swaggerJsdoc).toHaveBeenCalledWith(expect.objectContaining({
      apis: expect.arrayContaining([
        expect.stringContaining('routes'),
        expect.stringContaining('controllers'),
        expect.stringContaining('models')
      ])
    }));
  });

  test('should handle JSON route response correctly', () => {
    const app = {
      use: jest.fn(),
      get: jest.fn()
    } as unknown as Express;
    
    setupSwagger(app);
    
    // Extract the handler function that was registered
    const [path, handler] = (app.get as jest.Mock).mock.calls[0] as [string, (req: any, res: any) => void];
    expect(path).toBe('/api-docs.json');
    
    // Mock request and response objects
    const req = {};
    const res = {
      setHeader: jest.fn(),
      send: jest.fn()
    };
    
    // Call the handler function
    handler(req, res);
    
    // Verify response handling
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(res.send).toHaveBeenCalledWith(mockSwaggerSpec);
  });
});

// Moving the test for package.json loading failure to its own describe block for isolation
describe('Swagger Configuration', () => {
  // ...existing code...

  test('should handle package.json loading failures gracefully', () => {
    // Reset modules to get a fresh import
    jest.resetModules();
    
    // Clear any previous mock calls
    (console.error as jest.Mock).mockClear();
    
    // Create a proper package.json mock that throws an error
    jest.doMock('../../package.json', () => {
      throw new Error('Could not load package.json');
    });
    
    // Re-import the module after setting up the mock
    const { setupSwagger } = require('../../config/swagger');
    
    const app = {
      use: jest.fn(),
      get: jest.fn()
    } as unknown as Express;
    
    setupSwagger(app);
    
    // Verify fallback values are used
    expect(console.error).toHaveBeenCalledWith('Could not load package.json, using defaults');
    expect(swaggerJsdoc).toHaveBeenCalledWith(expect.objectContaining({
      definition: expect.objectContaining({
        info: expect.objectContaining({
          title: 'Rising BSM API',
          version: '1.0.0',
          description: 'Business Service Management API'
        })
      })
    }));
  });

  // ...existing code...
});