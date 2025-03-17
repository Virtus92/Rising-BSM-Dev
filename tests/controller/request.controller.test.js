const requestController = require('../../controllers/request.controller');
const pool = require('../../services/db.service');
const { formatDateSafely } = require('../../utils/formatters');
const { getAnfrageStatusInfo } = require('../../utils/helpers');
const exportService = require('../../services/export.service');

jest.mock('../../services/db.service');
jest.mock('../../utils/formatters');
jest.mock('../../utils/helpers');
jest.mock('../../services/export.service');

describe('Request Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      session: { user: { id: 1, name: 'Test User' } },
      ip: '127.0.0.1'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
    formatDateSafely.mockImplementation(date => date ? 'formatted-date' : '');
    getAnfrageStatusInfo.mockReturnValue({ label: 'New', className: 'warning' });
  });

  describe('getAllRequests', () => {
    test('should return all requests with filtering and pagination', async () => {
      req.query = { status: 'neu', service: 'facility', date: '2023-01-01', search: 'john', page: '2', limit: '5' };
      
      const mockRequests = [
        { id: 1, name: 'John Doe', email: 'john@example.com', service: 'facility', status: 'neu', created_at: new Date() }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: mockRequests });
      pool.query.mockResolvedValueOnce({ rows: [{ total: '15' }] });

      await requestController.getAllRequests(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        requests: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: 'John Doe',
            email: 'john@example.com'
          })
        ]),
        pagination: {
          current: 2,
          limit: 5,
          total: 3,
          totalRecords: 15
        },
        filters: {
          status: 'neu',
          service: 'facility',
          date: '2023-01-01',
          search: 'john'
        }
      });
    });
  });

  describe('getRequestById', () => {
    test('should return request with notes by ID', async () => {
      req.params = { id: '1' };
      
      const mockRequest = { 
        id: 1, 
        name: 'John Doe', 
        email: 'john@example.com', 
        phone: '123456789', 
        service: 'facility', 
        message: 'Test message', 
        status: 'neu', 
        created_at: new Date() 
      };
      
      const mockNotes = [
        { id: 1, text: 'Test note', erstellt_am: new Date(), benutzer_name: 'Admin' }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: [mockRequest] });
      pool.query.mockResolvedValueOnce({ rows: mockNotes });

      await requestController.getRequestById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        request: expect.objectContaining({
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        }),
        notes: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            text: 'Test note'
          })
        ])
      });
    });

    test('should return 404 when request does not exist', async () => {
      req.params = { id: '999' };
      pool.query.mockResolvedValueOnce({ rows: [] });

      await requestController.getRequestById(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Request with ID 999 not found'
        })
      );
    });
  });

  describe('updateRequestStatus', () => {
    test('should update request status', async () => {
      req.body = { id: '1', status: 'in_bearbeitung', note: 'Status updated' };
      
      pool.query.mockResolvedValueOnce({});
      pool.query.mockResolvedValueOnce({});
      pool.query.mockResolvedValueOnce({});

      await requestController.updateRequestStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        requestId: '1',
        message: 'Request status updated successfully'
      });
    });

    test('should validate required fields', async () => {
      req.body = { id: '1' }; // Missing status

      await requestController.updateRequestStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Request ID and status are required'
        })
      );
    });

    test('should validate status value', async () => {
      req.body = { id: '1', status: 'invalid_status' };

      await requestController.updateRequestStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid status value'
        })
      );
    });
  });

  describe('addRequestNote', () => {
    test('should add note to request', async () => {
      req.params = { id: '1' };
      req.body = { note: 'Test note' };
      
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      pool.query.mockResolvedValueOnce({});
      pool.query.mockResolvedValueOnce({});

      await requestController.addRequestNote(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        requestId: '1',
        message: 'Note added successfully'
      });
    });

    test('should validate note is not empty', async () => {
      req.params = { id: '1' };
      req.body = { note: '' };

      await requestController.addRequestNote(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Note cannot be empty'
        })
      );
    });
  });

  describe('exportRequests', () => {
    test('should export requests with proper filters', async () => {
      req.query = { 
        format: 'json', 
        dateFrom: '2023-01-01', 
        dateTo: '2023-12-31',
        status: ['neu', 'in_bearbeitung'] 
      };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com', service: 'facility', status: 'neu', created_at: new Date() }
        ] 
      });
      
      const mockExportData = { data: 'exported data' };
      exportService.generateExport.mockResolvedValueOnce(mockExportData);

      await requestController.exportRequests(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockExportData);
    });
  });
});
