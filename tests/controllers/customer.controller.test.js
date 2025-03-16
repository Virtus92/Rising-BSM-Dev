const customerController = require('../../controllers/customer.controller');
const pool = require('../../services/db.service');
const exportService = require('../../services/export.service');
const { mockRequest, mockResponse, mockDbClient } = require('../setup');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('../../services/export.service');
jest.mock('../../utils/helpers', () => ({
  getProjektStatusInfo: (status) => {
    const statusMap = {
      'neu': { label: 'Neu', className: 'warning' },
      'in_bearbeitung': { label: 'In Bearbeitung', className: 'info' },
      'abgeschlossen': { label: 'Abgeschlossen', className: 'success' },
      'storniert': { label: 'Storniert', className: 'secondary' }
    };
    return statusMap[status] || { label: status, className: 'default' };
  },
  getTerminStatusInfo: (status) => {
    const statusMap = {
      'geplant': { label: 'Geplant', className: 'warning' },
      'bestaetigt': { label: 'Bestätigt', className: 'info' },
      'abgeschlossen': { label: 'Abgeschlossen', className: 'success' },
      'storniert': { label: 'Storniert', className: 'secondary' }
    };
    return statusMap[status] || { label: status, className: 'default' };
  }
}));

describe('Customer Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response, next
    mockReq = mockRequest();
    mockReq.session.user = { id: 1, name: 'Test User' };
    mockRes = mockResponse();
    mockNext = jest.fn();

    // Default pool query mock implementation
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
  });

  describe('getAllCustomers', () => {
    it('should return customers with pagination and apply filters', async () => {
      // Mock query parameters
      mockReq.query = {
        page: '1',
        limit: '10',
        status: 'aktiv',
        type: 'geschaeft',
        search: 'acme'
      };

      // Mock database responses
      pool.query.mockImplementation((query, params) => {
         if (query.includes('COUNT(*)') && !query.includes('stats') && params && params.length > 0) {
          return Promise.resolve({ rows: [{ total: '50' }] });
        } else if (query.includes('COUNT(*)') && !query.includes('stats')) {
          return Promise.resolve({ rows: [{ total: '50' }] });
        } else if (query.includes('COUNT(*) AS total') && query.includes('stats')) {
          return Promise.resolve({
            rows: [{
              total: '50',
              privat: '30',
              geschaeft: '20',
              aktiv: '40'
            }]
          });
        } else if (query.includes('DATE_TRUNC')) {
          return Promise.resolve({
            rows: [
              { month: '2023-01-01T00:00:00Z', customer_count: '5' },
              { month: '2023-02-01T00:00:00Z', customer_count: '8' }
            ]
          });
        } else {
          return Promise.resolve({
            rows: [
              {
                id: 1,
                name: 'ACME Inc.',
                firma: 'ACME Corporation',
                email: 'contact@acme.com',
                telefon: '123456789',
                adresse: 'Main Street 1',
                plz: '10001',
                ort: 'New York',
                status: 'aktiv',
                kundentyp: 'geschaeft',
                created_at: '2023-01-01T10:00:00Z'
              },
              {
                id: 2,
                name: 'ACME Services Ltd',
                firma: 'ACME Services',
                email: 'services@acme.com',
                telefon: '987654321',
                adresse: 'Second Avenue 42',
                plz: '10002',
                ort: 'New York',
                status: 'aktiv',
                kundentyp: 'geschaeft',
                created_at: '2023-02-01T09:00:00Z'
              }
            ]
          });
        }
      });

      // Execute the controller method
      const result = await customerController.getAllCustomers(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('customers');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('filters');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('growthData');
      expect(result.customers).toHaveLength(2);
      expect(result.pagination.total).toBe(5); // Math.ceil(50/10)
      expect(result.pagination.current).toBe(1);
      expect(result.filters.status).toBe('aktiv');
      expect(result.filters.type).toBe('geschaeft');
      expect(result.stats.total).toBe('50');
      expect(result.stats.privat).toBe('30');
      expect(result.stats.geschaeft).toBe('20');
      expect(result.stats.aktiv).toBe('40');
      expect(result.growthData).toHaveLength(2);
    });

    it('should handle errors', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      // Execute the controller method
      await customerController.getAllCustomers(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].success).toBe(false);
    });
  });

  describe('getCustomerById', () => {
    it('should return customer details with projects and appointments', async () => {
      // Mock request params
      mockReq.params = { id: '1' };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text === 'SELECT * FROM kunden WHERE id = $1') {
          return Promise.resolve({ 
            rows: [{ 
              id: 1, 
              name: 'ACME Inc.', 
              firma: 'ACME Corporation',
              email: 'contact@acme.com',
              telefon: '123456789',
              adresse: 'Main Street 1',
              plz: '10001',
              ort: 'New York',
              kundentyp: 'geschaeft',
              status: 'aktiv',
              notizen: 'Important customer',
              newsletter: true,
              created_at: '2023-01-01T10:00:00Z'
            }] 
          });
        } else if (query.text && query.text.includes('termine')) {
          return Promise.resolve({
            rows: [
              { 
                id: 101, 
                titel: 'Initial Meeting', 
                termin_datum: '2023-06-05T10:00:00Z',
                status: 'abgeschlossen'
              },
              {
                id: 102,
                titel: 'Follow-up Meeting',
                termin_datum: '2023-06-20T14:00:00Z',
                status: 'geplant'
              }
            ]
          });
        } else if (query.text && query.text.includes('projekte')) {
          return Promise.resolve({
            rows: [
              { 
                id: 201, 
                titel: 'Office Renovation', 
                start_datum: '2023-06-01T00:00:00Z',
                status: 'in_bearbeitung'
              },
              {
                id: 202,
                titel: 'Annual Maintenance',
                start_datum: '2023-07-01T00:00:00Z',
                status: 'geplant'
              }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Execute the controller method
      const result = await customerController.getCustomerById(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('customer');
      expect(result).toHaveProperty('appointments');
      expect(result).toHaveProperty('projects');
      expect(result.customer.id).toBe(1);
      expect(result.customer.name).toBe('ACME Inc.');
      expect(result.appointments).toHaveLength(2);
      expect(result.projects).toHaveLength(2);
    });

    it('should handle customer not found', async () => {
      // Mock request params
      mockReq.params = { id: '999' };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await customerController.getCustomerById(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      // Mock request body
      mockReq.body = {
        name: 'New Customer',
        firma: 'New Company',
        email: 'new@example.com',
        telefon: '123456789',
        adresse: 'Sample Street 1',
        plz: '12345',
        ort: 'Sample City',
        kundentyp: 'geschaeft',
        status: 'aktiv',
        notizen: 'New customer notes',
        newsletter: 'on'
      };

      // Mock database response for insert
      pool.query.mockResolvedValueOnce({ rows: [{ id: 3 }] });

      // Execute the controller method
      const result = await customerController.createCustomer(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(2); // Insert + log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('customerId', 3);
    });

    it('should validate required fields', async () => {
      // Mock request body with missing required fields
      mockReq.body = {
        name: '', // Missing name
        email: '' // Missing email
      };

      // Execute the controller method
      await customerController.createCustomer(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      // Mock request params and body
      mockReq.params = { id: '1' };
      mockReq.body = {
        name: 'Updated Customer',
        firma: 'Updated Company',
        email: 'updated@example.com',
        telefon: '987654321',
        kundentyp: 'geschaeft'
      };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text && query.text.includes('SELECT id FROM')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      // Execute the controller method
      const result = await customerController.updateCustomer(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Check + Update + Log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('customerId', '1');
    });

    it('should handle customer not found', async () => {
      // Mock request params
      mockReq.params = { id: '999' };
      mockReq.body = {
        name: 'Updated Customer',
        email: 'updated@example.com'
      };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await customerController.updateCustomer(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('addCustomerNote', () => {
    it('should add a note to a customer', async () => {
      // Mock request params and body
      mockReq.params = { id: '1' };
      mockReq.body = { notiz: 'New customer note' };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text === 'SELECT notizen FROM kunden WHERE id = $1') {
          return Promise.resolve({ rows: [{ notizen: 'Existing notes' }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      // Execute the controller method
      const result = await customerController.addCustomerNote(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Check + Update + Log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('customerId', '1');
    });

    it('should validate note content', async () => {
      // Mock request params and body with empty note
      mockReq.params = { id: '1' };
      mockReq.body = { notiz: '' };

      // Execute the controller method
      await customerController.addCustomerNote(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].message).toBe('Note cannot be empty');
    });
  });

  describe('exportCustomers', () => {
    it('should export customer data', async () => {
      // Mock request query
      mockReq.query = { 
        format: 'xlsx', 
        status: 'aktiv',
        type: 'geschaeft'
      };

      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: 'ACME Inc.',
            firma: 'ACME Corporation',
            email: 'contact@acme.com',
            telefon: '123456789',
            adresse: 'Main Street 1',
            plz: '10001',
            ort: 'New York',
            kundentyp: 'geschaeft',
            status: 'aktiv',
            created_at: '2023-01-01T10:00:00Z'
          }
        ]
      });

      // Mock export service
      exportService.generateExport.mockResolvedValueOnce({
        filename: 'kunden-export.xlsx',
        content: Buffer.from('mock-excel-content')
      });

      // Execute the controller method
      const result = await customerController.exportCustomers(mockReq, mockRes, mockNext);

      // Assertions
      expect(exportService.generateExport).toHaveBeenCalled();
      expect(result).toHaveProperty('filename', 'kunden-export.xlsx');
    });
  });
});
