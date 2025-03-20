import {
    sendSuccess,
    sendError,
    sendPaginated,
    sendCreated,
    sendNoContent
  } from '../../../utils/api-response';
  import { describe, test, expect, jest, beforeEach } from '@jest/globals';
  
  describe('API Response Utilities', () => {
    let res: any;
    
    beforeEach(() => {
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis()
      };
    });
    
    describe('sendSuccess', () => {
      test('should send successful response with data', () => {
        const data = { id: 1, name: 'Test' };
        
        sendSuccess(res, data);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data,
          meta: expect.objectContaining({
            timestamp: expect.any(String)
          })
        }));
      });
      
      test('should include message when provided', () => {
        const data = { id: 1 };
        const message = 'Operation successful';
        
        sendSuccess(res, data, message);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data,
          message
        }));
      });
      
      test('should use custom status code when provided', () => {
        sendSuccess(res, { id: 1 }, 'Success', 201);
        
        expect(res.status).toHaveBeenCalledWith(201);
      });
      
      test('should include additional metadata when provided', () => {
        const meta = { version: '1.0.0' };
        
        sendSuccess(res, { id: 1 }, undefined, 200, meta);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          meta: expect.objectContaining({
            version: '1.0.0',
            timestamp: expect.any(String)
          })
        }));
      });
    });
    
    describe('sendError', () => {
      test('should send error response with message', () => {
        sendError(res, 'Something went wrong');
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: 'Something went wrong'
        }));
      });
      
      test('should handle Error objects', () => {
        const error = new Error('Test error');
        
        sendError(res, error);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          error: 'Test error'
        }));
      });
      
      test('should use custom status code when provided', () => {
        sendError(res, 'Not found', 404);
        
        expect(res.status).toHaveBeenCalledWith(404);
      });
      
      test('should include array of errors when provided', () => {
        const errors = ['Field 1 is required', 'Field 2 is invalid'];
        
        sendError(res, 'Validation error', 400, errors);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          error: 'Validation error',
          errors
        }));
      });
      
      test('should include additional metadata when provided', () => {
        const meta = { field: 'username' };
        
        sendError(res, 'Invalid input', 400, undefined, meta);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          details: expect.objectContaining({
            field: 'username'
          })
        }));
      });
    });
    
    describe('sendPaginated', () => {
      test('should send paginated response with metadata', () => {
        const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const pagination = {
          current: 1,
          total: 3,
          limit: 10,
          totalRecords: 25
        };
        
        sendPaginated(res, data, pagination);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data,
          meta: expect.objectContaining({
            pagination
          })
        }));
      });
    });
    
    describe('sendCreated', () => {
      test('should send 201 Created response', () => {
        const data = { id: 1, name: 'New Resource' };
        
        sendCreated(res, data);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data,
          message: 'Resource created successfully'
        }));
      });
      
      test('should use custom message when provided', () => {
        sendCreated(res, { id: 1 }, 'User created successfully');
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          message: 'User created successfully'
        }));
      });
    });
    
    describe('sendNoContent', () => {
      test('should send 204 No Content response', () => {
        sendNoContent(res);
        
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });
    });
  });