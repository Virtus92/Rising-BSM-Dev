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

    test('should return requests with moving service label', async () => {
      req.query = { service: 'moving' };
      const mockRequests = [
      { id: 2, name: 'Jane Doe', email: 'jane@example.com', service: 'moving', status: 'neu', created_at: new Date() }
      ];
      pool.query.mockResolvedValueOnce({ rows: mockRequests });
      pool.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });
    
      await requestController.getAllRequests(req, res, next);
    
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      requests: expect.arrayContaining([
        expect.objectContaining({
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
        serviceLabel: 'Umzüge & Transporte'
        })
      ])
      }));
    });

    test('should handle errors and pass them to the next middleware', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await requestController.getAllRequests(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
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

    test('should return 404 if request does not exist when adding note', async () => {
      req.params = { id: '999' };
      req.body = { note: 'Test note' };
      pool.query.mockResolvedValueOnce({ rows: [] });

      await requestController.addRequestNote(req, res, next);

      expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Request with ID 999 not found'
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

    test('should handle errors during export', async () => {
      req.query = { format: 'json' };
      pool.query.mockRejectedValueOnce(new Error('Export failed'));

      await requestController.exportRequests(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should set headers and send buffer for non-JSON formats', async () => {
      req.query = { format: 'xlsx' };
      pool.query.mockResolvedValueOnce({ rows: [] });
      const mockExportData = { 
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'anfragen-export.xlsx',
      buffer: Buffer.from('test data')
      };
      exportService.generateExport.mockResolvedValueOnce(mockExportData);

      await requestController.exportRequests(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', mockExportData.contentType);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', `attachment; filename="${mockExportData.filename}"`);
      expect(res.send).toHaveBeenCalledWith(mockExportData.buffer);
    });

    test('should handle single status filter for export', async () => {
      req.query = { format: 'json', status: 'neu' };
      pool.query.mockResolvedValueOnce({ rows: [] });
      exportService.generateExport.mockResolvedValueOnce({});

      await requestController.exportRequests(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle no filters for export', async () => {
      req.query = { format: 'json' };
      pool.query.mockResolvedValueOnce({ rows: [] });
      exportService.generateExport.mockResolvedValueOnce({});

      await requestController.exportRequests(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle errors during export', async () => {
      req.query = { format: 'json' };
      pool.query.mockRejectedValueOnce(new Error('Export failed'));

      await requestController.exportRequests(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should set headers and send buffer for non-JSON formats', async () => {
      req.query = { format: 'xlsx' };
      pool.query.mockResolvedValueOnce({ rows: [] });
      const mockExportData = { 
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'anfragen-export.xlsx',
      buffer: Buffer.from('test data')
      };
      exportService.generateExport.mockResolvedValueOnce(mockExportData);

      await requestController.exportRequests(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', mockExportData.contentType);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', `attachment; filename="${mockExportData.filename}"`);
      expect(res.send).toHaveBeenCalledWith(mockExportData.buffer);
    });

    test('should handle single status filter for export', async () => {
      req.query = { format: 'json', status: 'neu' };
      pool.query.mockResolvedValueOnce({ rows: [] });
      exportService.generateExport.mockResolvedValueOnce({});

      await requestController.exportRequests(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle no filters for export', async () => {
      req.query = { format: 'json' };
      pool.query.mockResolvedValueOnce({ rows: [] });
      exportService.generateExport.mockResolvedValueOnce({});

      await requestController.exportRequests(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
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
