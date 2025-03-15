const requestController = require('../../controllers/request.controller');
const pool = require('../../services/db.service');
const exportService = require('../../services/export.service');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('../../services/export.service');
jest.mock('../../utils/helpers', () => ({
  getAnfrageStatusInfo: (status) => {
    const statusMap = {
      'neu': { label: 'Neu', className: 'warning' },
      'in_bearbeitung': { label: 'In Bearbeitung', className: 'info' },
      'beantwortet': { label: 'Beantwortet', className: 'success' },
      'geschlossen': { label: 'Geschlossen', className: 'secondary' }
    };
    return statusMap[status] || { label: status, className: 'default' };
  }
}));

describe('Request Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response, next
    mockReq = {
      session: {
        user: { id: 1, name: 'Test User' }
      },
      params: {},
      query: {},
      body: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();

    // Default pool query mock implementation
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
  });

  describe('getAllRequests', () => {
    it('should return requests with pagination and apply filters', async () => {
      // Mock query parameters
      mockReq.query = {
        page: '1',
        limit: '10',
        status: 'neu',
        service: 'facility',
        date: '2023-06-01',
        search: 'john'
      };

      // Mock database responses
      pool.query.mockImplementation((query, params) => {
        if (query.includes('COUNT(*)')) {
          return Promise.resolve({ rows: [{ total: '15' }] });
        } else {
          return Promise.resolve({
            rows: [
              {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                service: 'facility',
                status: 'neu',
                created_at: '2023-06-01T10:00:00Z'
              },
              {
                id: 2,
                name: 'John Smith',
                email: 'smith@example.com',
                service: 'facility',
                status: 'neu',
                created_at: '2023-06-01T11:00:00Z'
              }
            ]
          });
        }
      });

      // Execute the controller method
      const result = await requestController.getAllRequests(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('requests');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('filters');
      expect(result.requests).toHaveLength(2);
      expect(result.pagination.total).toBe(2); // Math.ceil(15/10)
      expect(result.pagination.current).toBe(1);
      expect(result.filters.status).toBe('neu');
      expect(result.filters.service).toBe('facility');
    });

    it('should handle errors', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      // Execute the controller method
      await requestController.getAllRequests(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].success).toBe(false);
    });
  });

  describe('getRequestById', () => {
    it('should return request details and notes', async () => {
      // Mock request params
      mockReq.params = { id: '1' };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text === 'SELECT * FROM kontaktanfragen WHERE id = $1') {
          return Promise.resolve({ 
            rows: [{ 
              id: 1, 
              name: 'John Doe', 
              email: 'john@example.com',
              phone: '1234567890',
              service: 'facility', 
              message: 'Test message',
              status: 'neu',
              created_at: '2023-06-01T10:00:00Z' 
            }] 
          });
        } else if (query.text.includes('anfragen_notizen')) {
          return Promise.resolve({
            rows: [
              { 
                id: 1, 
                text: 'First note', 
                erstellt_am: '2023-06-01T10:30:00Z',
                benutzer_name: 'Admin User'
              }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Execute the controller method
      const result = await requestController.getRequestById(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('request');
      expect(result).toHaveProperty('notes');
      expect(result.request.id).toBe(1);
      expect(result.request.name).toBe('John Doe');
      expect(result.request.serviceLabel).toBe('Facility Management');
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].text).toBe('First note');
    });

    it('should handle request not found', async () => {
      // Mock request params
      mockReq.params = { id: '999' };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await requestController.getRequestById(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('updateRequestStatus', () => {
    it('should update request status and add note if provided', async () => {
      // Mock request body
      mockReq.body = {
        id: '1',
        status: 'in_bearbeitung',
        note: 'Status update note'
      };

      // Mock database responses
      pool.query.mockResolvedValue({ rowCount: 1 });

      // Execute the controller method
      const result = await requestController.updateRequestStatus(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Update status + Add note + Log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('requestId', '1');
    });

    it('should validate required fields', async () => {
      // Mock request body with missing status
      mockReq.body = {
        id: '1'
      };

      // Execute the controller method
      await requestController.updateRequestStatus(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should validate status value', async () => {
      // Mock request body with invalid status
      mockReq.body = {
        id: '1',
        status: 'invalid_status'
      };

      // Execute the controller method
      await requestController.updateRequestStatus(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid status value');
    });
  });

  describe('addRequestNote', () => {
    it('should add a note to a request', async () => {
      // Mock request params and body
      mockReq.params = { id: '1' };
      mockReq.body = { note: 'New note for the request' };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text.includes('SELECT id FROM')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      // Execute the controller method
      const result = await requestController.addRequestNote(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Check + Insert note + Log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('requestId', '1');
    });

    it('should validate note content', async () => {
      // Mock request params and body with empty note
      mockReq.params = { id: '1' };
      mockReq.body = { note: '' };

      // Execute the controller method
      await requestController.addRequestNote(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].message).toBe('Note cannot be empty');
    });

    it('should check if request exists', async () => {
      // Mock request params and body
      mockReq.params = { id: '999' };
      mockReq.body = { note: 'Note for non-existent request' };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await requestController.addRequestNote(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('exportRequests', () => {
    it('should export requests data', async () => {
      // Mock request query
      mockReq.query = { 
        format: 'xlsx', 
        dateFrom: '2023-06-01', 
        dateTo: '2023-06-30',
        status: 'neu' 
      };

      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            service: 'facility',
            message: 'Test message',
            status: 'neu',
            created_at: '2023-06-01T10:00:00Z'
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: null,
            service: 'moving',
            message: 'Another test message',
            status: 'neu',
            created_at: '2023-06-02T09:00:00Z'
          }
        ]
      });

      // Mock export service
      exportService.generateExport.mockResolvedValueOnce({
        filename: 'anfragen-export.xlsx',
        content: Buffer.from('mock-excel-content')
      });

      // Execute the controller method
      const result = await requestController.exportRequests(mockReq, mockRes, mockNext);

      // Assertions
      expect(exportService.generateExport).toHaveBeenCalled();
      expect(result).toHaveProperty('filename', 'anfragen-export.xlsx');
    });
  });
});
