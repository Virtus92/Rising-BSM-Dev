const serviceController = require('../../controllers/service.controller');
const pool = require('../../services/db.service');
const exportService = require('../../services/export.service');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('../../services/export.service');

describe('Service Controller', () => {
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

  describe('getAllServices', () => {
    it('should return service list with pagination', async () => {
      // Mock query parameters
      mockReq.query = {
        page: '1',
        limit: '10',
        status: 'aktiv',
        search: 'cleaning'
      };

      // Mock database responses
      pool.query.mockImplementation((query, params) => {
        if (query.includes('COUNT(*)')) {
          return Promise.resolve({ rows: [{ total: '25' }] });
        } else {
          return Promise.resolve({
            rows: [
              {
                id: 1,
                name: 'Office Cleaning',
                beschreibung: 'Regular office cleaning service',
                preis_basis: '50.00',
                einheit: 'hour',
                mwst_satz: '20.00',
                aktiv: true,
                created_at: '2023-01-01T10:00:00Z',
                updated_at: '2023-01-10T15:30:00Z'
              },
              {
                id: 2,
                name: 'Deep Cleaning',
                beschreibung: 'Thorough cleaning of all areas',
                preis_basis: '75.00',
                einheit: 'hour',
                mwst_satz: '20.00',
                aktiv: true,
                created_at: '2023-01-02T09:00:00Z',
                updated_at: '2023-01-12T14:20:00Z'
              }
            ]
          });
        }
      });

      // Execute the controller method
      const result = await serviceController.getAllServices(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('services');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('filters');
      expect(result.services).toHaveLength(2);
      expect(result.pagination.total).toBe(3); // Math.ceil(25/10)
      expect(result.pagination.current).toBe(1);
      expect(result.filters.status).toBe('aktiv');
      expect(result.filters.search).toBe('cleaning');
    });

    it('should handle errors', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      // Execute the controller method
      await serviceController.getAllServices(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].success).toBe(false);
    });
  });

  describe('getServiceById', () => {
    it('should return service details', async () => {
      // Mock request params
      mockReq.params = { id: '1' };

      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Office Cleaning',
          beschreibung: 'Regular office cleaning service',
          preis_basis: '50.00',
          einheit: 'hour',
          mwst_satz: '20.00',
          aktiv: true,
          created_at: '2023-01-01T10:00:00Z',
          updated_at: '2023-01-10T15:30:00Z'
        }]
      });

      // Execute the controller method
      const result = await serviceController.getServiceById(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith({
        text: expect.stringContaining('SELECT'),
        values: ['1']
      });
      expect(result).toHaveProperty('service');
      expect(result.service.id).toBe(1);
      expect(result.service.name).toBe('Office Cleaning');
    });

    it('should handle service not found', async () => {
      // Mock request params
      mockReq.params = { id: '999' };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await serviceController.getServiceById(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('createService', () => {
    it('should create a new service', async () => {
      // Mock request body
      mockReq.body = {
        name: 'Window Cleaning',
        beschreibung: 'Professional window cleaning service',
        preis_basis: '45.00',
        einheit: 'hour',
        mwst_satz: '20',
        aktiv: 'on'
      };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text && query.text.includes('INSERT INTO dienstleistungen')) {
          return Promise.resolve({ rows: [{ id: 3 }] });
        }
        return Promise.resolve({ rows: [] });
      });

      // Execute the controller method
      const result = await serviceController.createService(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(2); // Insert + log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('serviceId', 3);
    });

    it('should validate required fields', async () => {
      // Mock request body with missing fields
      mockReq.body = {
        name: '', // Missing name
        preis_basis: '', // Missing price
        einheit: 'hour'
      };

      // Execute the controller method
      await serviceController.createService(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('required');
    });

    it('should validate price format', async () => {
      // Mock request body with invalid price
      mockReq.body = {
        name: 'Test Service',
        preis_basis: 'not-a-number',
        einheit: 'hour'
      };

      // Execute the controller method
      await serviceController.createService(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('number');
    });
  });

  describe('updateService', () => {
    it('should update an existing service', async () => {
      // Mock request params and body
      mockReq.params = { id: '1' };
      mockReq.body = {
        name: 'Updated Service',
        beschreibung: 'Updated description',
        preis_basis: '60.00',
        einheit: 'hour',
        mwst_satz: '20',
        aktiv: 'on'
      };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text && query.text.includes('SELECT id FROM')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      // Execute the controller method
      const result = await serviceController.updateService(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Check + Update + Log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('serviceId', '1');
    });

    it('should handle service not found', async () => {
      // Mock request params
      mockReq.params = { id: '999' };
      mockReq.body = {
        name: 'Updated Service',
        preis_basis: '60.00',
        einheit: 'hour'
      };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await serviceController.updateService(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('getServiceStatistics', () => {
    it('should return service statistics', async () => {
      // Mock request params
      mockReq.params = { id: '1' };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text.includes('SELECT name FROM')) {
          return Promise.resolve({ rows: [{ name: 'Office Cleaning' }] });
        } else if (query.text.includes('gesamtumsatz')) {
          return Promise.resolve({ 
            rows: [{ gesamtumsatz: '5000.00', rechnungsanzahl: '10' }] 
          });
        } else if (query.text.includes('monat')) {
          return Promise.resolve({
            rows: [
              { monat: '2023-05-01T00:00:00Z', umsatz: '2000.00' },
              { monat: '2023-06-01T00:00:00Z', umsatz: '3000.00' }
            ]
          });
        } else {
          return Promise.resolve({
            rows: [
              { id: 1, name: 'Customer A', umsatz: '2000.00' },
              { id: 2, name: 'Customer B', umsatz: '1500.00' }
            ]
          });
        }
      });

      // Execute the controller method
      const result = await serviceController.getServiceStatistics(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('statistics');
      expect(result.statistics).toHaveProperty('gesamtumsatz');
      expect(result.statistics).toHaveProperty('monatlicheUmsaetze');
      expect(result.statistics).toHaveProperty('topKunden');
      expect(result.statistics.name).toBe('Office Cleaning');
      expect(result.statistics.monatlicheUmsaetze).toHaveLength(2);
      expect(result.statistics.topKunden).toHaveLength(2);
    });
  });

  describe('exportServices', () => {
    it('should export services data', async () => {
      // Mock request query
      mockReq.query = { format: 'xlsx', status: 'aktiv' };

      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: 'Office Cleaning',
            beschreibung: 'Regular office cleaning',
            preis_basis: '50.00',
            einheit: 'hour',
            mwst_satz: '20.00',
            aktiv: true,
            created_at: '2023-01-01T10:00:00Z'
          },
          {
            id: 2,
            name: 'Window Cleaning',
            beschreibung: 'Professional window cleaning',
            preis_basis: '45.00',
            einheit: 'hour',
            mwst_satz: '20.00',
            aktiv: true,
            created_at: '2023-01-02T09:00:00Z'
          }
        ]
      });

      // Mock export service
      exportService.generateExport.mockResolvedValueOnce({
        filename: 'dienstleistungen-export.xlsx',
        content: Buffer.from('mock-excel-content')
      });

      // Execute the controller method
      const result = await serviceController.exportServices(mockReq, mockRes, mockNext);

      // Assertions
      expect(exportService.generateExport).toHaveBeenCalled();
      expect(result).toHaveProperty('filename', 'dienstleistungen-export.xlsx');
    });
  });
});
