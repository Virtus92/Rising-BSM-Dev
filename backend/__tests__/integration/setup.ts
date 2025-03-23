import express from 'express';
import request from 'supertest';
import bodyParser from 'body-parser';
import cors from 'cors';
import { authenticate } from '../../middleware/auth.middleware.js';
import { errorHandler } from '../../middleware/error.middleware.js';

/**
 * Create a test Express app with common middleware
 */
export function createTestApp() {
  const app = express();
  
  // Add common middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
  // Add error handler middleware
  app.use(errorHandler);
  
  return app;
}

/**
 * Create a test Express app with authentication middleware
 */
export function createAuthenticatedTestApp() {
  const app = createTestApp();
  app.use(authenticate);
  return app;
}

/**
 * Generate a mock JWT token for testing
 */
export function generateMockToken(userData: any = { id: 1, name: 'Test User', role: 'admin' }) {
  return 'mock-jwt-token';
}

/**
 * Add authentication headers to a request
 */
export function withAuth(request: request.Test, role: string = 'admin') {
  return request.set('Authorization', `Bearer ${generateMockToken({ role })}`);
}

/**
 * Utility to make authenticated requests
 */
export const authRequest = {
  get: (app: express.Express, url: string) => {
    return withAuth(request(app).get(url));
  },
  post: (app: express.Express, url: string, data?: any) => {
    return withAuth(request(app).post(url).send(data || {}));
  },
  put: (app: express.Express, url: string, data?: any) => {
    return withAuth(request(app).put(url).send(data || {}));
  },
  patch: (app: express.Express, url: string, data?: any) => {
    return withAuth(request(app).patch(url).send(data || {}));
  },
  delete: (app: express.Express, url: string) => {
    return withAuth(request(app).delete(url));
  }
};