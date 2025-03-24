/**
 * Notification Routes Tests
 * 
 * Integration tests for notification routes.
 */
import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import notificationRoutes from '../../../routes/notification.routes.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../../../middleware/validation.middleware.js';
import * as notificationController from '../../../controller/notification.controller.js';
import { errorHandler } from '../../../middleware/error.middleware.js';
import { NotFoundError, ForbiddenError } from '../../../utils/error.utils.js';

// Mock dependencies
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: jest.fn((_req, _res, next) => next())
}));

jest.mock('../middleware/validation.middleware', () => ({
  validateBody: jest.fn((_schema) => (_req, _res, next) => next()),
  validateParams: jest.fn((_schema) => (_req, _res, next) => next()),
  validateQuery: jest.fn((_schema) => (_req, _res, next) => next())
}));

jest.mock('../controllers/notification.controller', () => ({
  getNotifications: jest.fn((_req, res) => res.json({ success: true, data: [] })),
  markNotificationsRead: jest.fn((_req, res) => res.json({ success: true, data: { count: 1 } })),
  getNotificationStats: jest.fn((_req, res) => res.json({ success: true, data: { totalCount: 0 } })),
  deleteNotification: jest.fn((_req, res) => res.json({ success: true, data: { id: 1 } }))
}));

describe('Notification Routes', () => {
  let app: express.Application;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Setup authentication mock to add user
    (authenticate as jest.Mock).mockImplementation((req, _res, next) => {
      (req as any).user = { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' };
      next();
    });
    
    // Mount notification routes
    app.use('/api/notifications', notificationRoutes);
    
    // Add error handler
    app.use(errorHandler);
  });

  describe('GET /api/notifications', () => {
    it('should call authenticate middleware', async () => {
      // Act
      await request(app).get('/api/notifications');
      
      // Assert
      expect(authenticate).toHaveBeenCalled();
    });
    
    it('should call validation middleware', async () => {
      // Act
      await request(app).get('/api/notifications');
      
      // Assert
      expect(validateQuery).toHaveBeenCalled();
    });
    
    it('should call getNotifications controller', async () => {
      // Act
      await request(app).get('/api/notifications');
      
      // Assert
      expect(notificationController.getNotifications).toHaveBeenCalled();
    });
    
    it('should return 200 status code', async () => {
      // Act
      const response = await request(app).get('/api/notifications');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: [] });
    });
    
    it('should handle errors correctly', async () => {
      // Arrange
      (notificationController.getNotifications as jest.Mock).mockImplementationOnce((_req, _res, next) => {
        next(new Error('Test error'));
      });
      
      // Act
      const response = await request(app).get('/api/notifications');
      
      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Test error');
    });
  });
  
  describe('GET /api/notifications/stats', () => {
    it('should call authenticate middleware', async () => {
      // Act
      await request(app).get('/api/notifications/stats');
      
      // Assert
      expect(authenticate).toHaveBeenCalled();
    });
    
    it('should call getNotificationStats controller', async () => {
      // Act
      await request(app).get('/api/notifications/stats');
      
      // Assert
      expect(notificationController.getNotificationStats).toHaveBeenCalled();
    });
    
    it('should return 200 status code', async () => {
      // Act
      const response = await request(app).get('/api/notifications/stats');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: { totalCount: 0 } });
    });
  });
  
  describe('PUT /api/notifications/read', () => {
    it('should call authenticate and validation middleware', async () => {
      // Act
      await request(app).put('/api/notifications/read').send({ markAll: true });
      
      // Assert
      expect(authenticate).toHaveBeenCalled();
      expect(validateBody).toHaveBeenCalled();
    });
    
    it('should call markNotificationsRead controller', async () => {
      // Act
      await request(app).put('/api/notifications/read').send({ markAll: true });
      
      // Assert
      expect(notificationController.markNotificationsRead).toHaveBeenCalled();
    });
    
    it('should return 200 status code', async () => {
      // Act
      const response = await request(app).put('/api/notifications/read').send({ markAll: true });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: { count: 1 } });
    });
    
    it('should handle NotFoundError correctly', async () => {
      // Arrange
      (notificationController.markNotificationsRead as jest.Mock).mockImplementationOnce((_req, _res, next) => {
        next(new NotFoundError('Notification not found'));
      });
      
      // Act
      const response = await request(app).put('/api/notifications/read').send({ notificationId: 999 });
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Notification not found');
    });
  });
  
  describe('DELETE /api/notifications/:id', () => {
    it('should call authenticate and validation middleware', async () => {
      // Act
      await request(app).delete('/api/notifications/1');
      
      // Assert
      expect(authenticate).toHaveBeenCalled();
      expect(validateParams).toHaveBeenCalled();
    });
    
    it('should call deleteNotification controller', async () => {
      // Act
      await request(app).delete('/api/notifications/1');
      
      // Assert
      expect(notificationController.deleteNotification).toHaveBeenCalled();
    });
    
    it('should return 200 status code', async () => {
      // Act
      const response = await request(app).delete('/api/notifications/1');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: { id: 1 } });
    });
    
    it('should handle NotFoundError correctly', async () => {
      // Arrange
      (notificationController.deleteNotification as jest.Mock).mockImplementationOnce((_req, _res, next) => {
        next(new NotFoundError('Notification not found'));
      });
      
      // Act
      const response = await request(app).delete('/api/notifications/999');
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Notification not found');
    });
    
    it('should handle ForbiddenError correctly', async () => {
      // Arrange
      (notificationController.deleteNotification as jest.Mock).mockImplementationOnce((_req, _res, next) => {
        next(new ForbiddenError('You do not have permission to delete this notification'));
      });
      
      // Act
      const response = await request(app).delete('/api/notifications/1');
      
      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('You do not have permission to delete this notification');
    });
  });
  
  describe('Route configuration', () => {
    it('should apply authentication middleware to all routes', () => {
      // Isolate the calls for each route
      request(app).get('/api/notifications');
      request(app).get('/api/notifications/stats');
      request(app).put('/api/notifications/read');
      request(app).delete('/api/notifications/1');
      
      // Assert that authenticate was called for each route
      expect(authenticate).toHaveBeenCalledTimes(4);
    });
    
    it('should apply correct validation middleware to each route', () => {
      // Call each route
      request(app).get('/api/notifications');
      request(app).put('/api/notifications/read');
      request(app).delete('/api/notifications/1');
      
      // Check the right validation was used
      expect(validateQuery).toHaveBeenCalledTimes(1);
      expect(validateBody).toHaveBeenCalledTimes(1);
      expect(validateParams).toHaveBeenCalledTimes(1);
    });
  });
});