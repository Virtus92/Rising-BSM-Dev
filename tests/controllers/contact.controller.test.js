const contactController = require('../../controllers/contact.controller');
const pool = require('../../services/db.service');
const NotificationService = require('../../services/notification.service');
const { validateInput } = require('../../utils/validators');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('../../services/notification.service');
jest.mock('../../utils/validators');

describe('Contact Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response, next
    mockReq = {
      body: {},
      ip: '127.0.0.1',
      xhr: false,
      headers: {
        accept: 'text/html'
      },
      flash: jest.fn()
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn()
    };
    
    mockNext = jest.fn();

    // Default pool query mock implementation
    pool.query = jest.fn().mockResolvedValue({ rows: [] });

    // Mock validation to succeed by default
    validateInput.mockReturnValue({
      isValid: true,
      validatedData: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        service: 'facility',
        message: 'Test message'
      },
      errors: {}
    });

    // Mock NotificationService
    NotificationService.create = jest.fn().mockResolvedValue({});
  });

  describe('submitContact', () => {
    it('should successfully submit contact form (HTML request)', async () => {
      // Mock request body
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        service: 'facility',
        message: 'Test message'
      };

      // Mock database responses
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ id: 1 }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ id: 101 }, { id: 102 }] })
      );

      // Execute controller method
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(validateInput).toHaveBeenCalledWith(mockReq.body, expect.any(Object));
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(NotificationService.create).toHaveBeenCalledTimes(2); // Once for each admin
      expect(mockReq.flash).toHaveBeenCalledWith('success', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
    });

    it('should successfully submit contact form (JSON request)', async () => {
      // Mock request for JSON response
      mockReq.xhr = true;
      mockReq.headers.accept = 'application/json';
      
      // Mock request body
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        service: 'facility',
        message: 'Test message'
      };

      // Mock database responses
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ id: 1 }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ id: 101 }] })
      );

      // Execute controller method
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(validateInput).toHaveBeenCalledWith(mockReq.body, expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        requestId: 1
      });
    });

    it('should handle validation errors', async () => {
      // Mock validation failure
      validateInput.mockReturnValue({
        isValid: false,
        errors: {
          name: 'Name is required',
          email: 'Email is invalid'
        }
      });

      // Mock request for JSON response
      mockReq.xhr = true;
      mockReq.headers.accept = 'application/json';
      
      // Execute controller method
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        errors: expect.any(Object)
      });
    });

    it('should handle database errors (HTML request)', async () => {
      // Mock database error
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // Execute controller method
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockReq.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
    });

    it('should handle database errors (JSON request)', async () => {
      // Mock request for JSON response
      mockReq.xhr = true;
      mockReq.headers.accept = 'application/json';
      
      // Mock database error
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // Execute controller method
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String)
      });
    });

    it('should handle unique constraint violations', async () => {
      // Mock request for JSON response
      mockReq.xhr = true;
      mockReq.headers.accept = 'application/json';
      
      // Mock unique constraint violation
      const error = new Error('Duplicate entry');
      error.code = '23505';
      pool.query.mockRejectedValueOnce(error);

      // Execute controller method
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('bereits übermittelt')
      });
    });
  });

  describe('getContactRequest', () => {
    it('should return contact request details', async () => {
      // Mock request params
      mockReq.params = { id: '1' };

      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          service: 'facility',
          message: 'Test message',
          status: 'neu',
          created_at: '2023-06-01T10:00:00Z',
          ip_adresse: '127.0.0.1'
        }]
      });

      // Execute controller method
      const result = await contactController.getContactRequest(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith({
        text: expect.stringContaining('SELECT * FROM kontaktanfragen'),
        values: ['1']
      });
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'John Doe');
      expect(result).toHaveProperty('email', 'john@example.com');
    });

    it('should handle contact request not found', async () => {
      // Mock request params
      mockReq.params = { id: '999' };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute controller method
      await contactController.getContactRequest(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toContain('nicht gefunden');
    });

    it('should handle database errors', async () => {
      // Mock request params
      mockReq.params = { id: '1' };

      // Mock database error
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // Execute controller method
      await contactController.getContactRequest(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].success).toBe(false);
    });
  });
});
