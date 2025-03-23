import { Response } from 'express';
import { ResponseFactory } from '../../../utils/response.factory.js';

describe('ResponseFactory', () => {
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    };
  });

  describe('success', () => {
    it('should send a success response with default status code 200', () => {
      // Arrange
      const data = { id: 1, name: 'Test' };
      const message = 'Success message';
      
      // Act
      ResponseFactory.success(mockResponse as Response, data, message);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
        message,
        meta: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });

    it('should send a success response with custom status code and metadata', () => {
      // Arrange
      const data = { id: 1, name: 'Test' };
      const message = 'Success message';
      const statusCode = 201;
      const meta = { custom: 'metadata' };
      
      // Act
      ResponseFactory.success(mockResponse as Response, data, message, statusCode, meta);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
        message,
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          custom: 'metadata'
        })
      });
    });
  });

  describe('paginated', () => {
    it('should send a paginated response with metadata', () => {
      // Arrange
      const data = [{ id: 1, name: 'Test 1' }, { id: 2, name: 'Test 2' }];
      const pagination = {
        current: 1,
        limit: 10,
        total: 2,
        totalRecords: 20
      };
      const message = 'Paginated data';
      
      // Act
      ResponseFactory.paginated(mockResponse as Response, data, pagination, message);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
        message,
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          pagination
        })
      });
    });
  });

  describe('created', () => {
    it('should send a created response with status code 201', () => {
      // Arrange
      const data = { id: 1, name: 'Created Resource' };
      
      // Act
      ResponseFactory.created(mockResponse as Response, data);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Resource created successfully',
        meta: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });

    it('should send a created response with custom message', () => {
      // Arrange
      const data = { id: 1, name: 'Created Resource' };
      const message = 'Custom creation message';
      
      // Act
      ResponseFactory.created(mockResponse as Response, data, message);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
        message,
        meta: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });
  });

  describe('noContent', () => {
    it('should send a no content response with status code 204', () => {
      // Act
      ResponseFactory.noContent(mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });

  describe('file', () => {
    it('should send a file response with correct headers', () => {
      // Arrange
      const data = Buffer.from('file content');
      const filename = 'test.txt';
      const contentType = 'text/plain';
      
      // Act
      ResponseFactory.file(mockResponse as Response, data, filename, contentType);
      
      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', contentType);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', `attachment; filename="${filename}"`);
      expect(mockResponse.send).toHaveBeenCalledWith(data);
    });
  });

  describe('status', () => {
    it('should send a status response', () => {
      // Arrange
      const message = 'Status message';
      
      // Act
      ResponseFactory.status(mockResponse as Response, message);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { status: 'success' },
        message,
        meta: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });

    it('should send an error status response for error status codes', () => {
      // Arrange
      const message = 'Error status message';
      const statusCode = 400;
      
      // Act
      ResponseFactory.status(mockResponse as Response, message, statusCode);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { status: 'error' },
        message,
        meta: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });
  });
});