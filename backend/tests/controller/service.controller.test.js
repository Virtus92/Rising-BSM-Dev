const serviceController = require('../../controllers/service.controller');
const pool = require('../../services/db.service');
const { formatDateSafely } = require('../../utils/formatters');
const exportService = require('../../services/export.service');

jest.mock('../../services/db.service');
jest.mock('../../utils/formatters');
jest.mock('../../services/export.service');

describe('Service Controller', () => {
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
  });

  describe('getAllServices', () => {
    test('should return all services with pagination and filters', async () => {
      req.query = { status: 'aktiv', search: 'test', page: '2', limit: '10' };
      
      const mockServices = [
        { id: 1, name: 'Service 1', beschreibung: 'Description 1', preis_basis: '100.00', einheit: 'h', mwst_satz: '20', aktiv: true, created_at: new Date(), updated_at: new Date() }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: mockServices });
      pool.query.mockResolvedValueOnce({ rows: [{ total: '30' }] });

      await serviceController.getAllServices(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        services: expect.arrayContaining([expect.objectContaining({ id: 1, name: 'Service 1' })]),
        pagination: {
          current: 2,
          limit: 10,
          total: 3,
          totalRecords: 30
        },
        filters: {
          status: 'aktiv',
          search: 'test'
        }
      });
    });

    test('should handle database errors', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      await serviceController.getAllServices(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    test('should return all services without filters', async () => {
      const mockServices = [
      { id: 1, name: 'Service 1', beschreibung: 'Description 1', preis_basis: '100.00', einheit: 'h', mwst_satz: '20', aktiv: true, created_at: new Date(), updated_at: new Date() }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: mockServices });
      pool.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

      await serviceController.getAllServices(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      services: expect.arrayContaining([expect.objectContaining({ id: 1, name: 'Service 1' })]),
      pagination: expect.any(Object),
      filters: expect.any(Object)
      }));
    });

    test('should apply "aktiv" status filter', async () => {
      req.query = { status: 'aktiv' };
      const mockServices = [{ id: 1, name: 'Service 1', beschreibung: 'Description 1', preis_basis: '100.00', einheit: 'h', mwst_satz: '20', aktiv: true, created_at: new Date(), updated_at: new Date() }];
      pool.query.mockResolvedValueOnce({ rows: mockServices });
      pool.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

      await serviceController.getAllServices(req, res, next);
      expect(pool.query).toHaveBeenCalled();
    });

    test('should apply "inaktiv" status filter', async () => {
      req.query = { status: 'inaktiv' };
      const mockServices = [{ id: 1, name: 'Service 1', beschreibung: 'Description 1', preis_basis: '100.00', einheit: 'h', mwst_satz: '20', aktiv: false, created_at: new Date(), updated_at: new Date() }];
      pool.query.mockResolvedValueOnce({ rows: mockServices });
      pool.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

      await serviceController.getAllServices(req, res, next);
      expect(pool.query).toHaveBeenCalled();
    });

    test('should apply search filter', async () => {
      req.query = { search: 'Service 1' };
      const mockServices = [{ id: 1, name: 'Service 1', beschreibung: 'Description 1', preis_basis: '100.00', einheit: 'h', mwst_satz: '20', aktiv: true, created_at: new Date(), updated_at: new Date() }];
      pool.query.mockResolvedValueOnce({ rows: mockServices });
      pool.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

      await serviceController.getAllServices(req, res, next);
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('getServiceById', () => {
    test('should return service by ID', async () => {
      req.params = { id: '1' };
      
      const mockService = { 
        id: 1, 
        name: 'Service 1', 
        beschreibung: 'Description 1', 
        preis_basis: '100.00',
        einheit: 'h', 
        mwst_satz: '20', 
        aktiv: true, 
        created_at: new Date(), 
        updated_at: new Date() 
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockService] });

      await serviceController.getServiceById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        service: expect.objectContaining({
          id: 1,
          name: 'Service 1',
          preis_basis: 100.0  // Converted to number
        })
      });
    });

    test('should return 404 when service does not exist', async () => {
      req.params = { id: '999' };
      pool.query.mockResolvedValueOnce({ rows: [] });

      await serviceController.getServiceById(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Service with ID 999 not found'
        })
      );
    });
  });

  describe('createService', () => {
    test('should create a new service', async () => {
      req.body = {
        name: 'New Service',
        beschreibung: 'New Description',
        preis_basis: '150.00',
        einheit: 'h',
        mwst_satz: '20',
        aktiv: 'on'
      };

      pool.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });
      pool.query.mockResolvedValueOnce({});

      await serviceController.createService(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        serviceId: 5,
        message: 'Service created successfully'
      });
    });

    test('should return 400 when required fields are missing', async () => {
      req.body = {
        name: 'New Service',
        // Missing preis_basis
        einheit: 'h'
      };

      await serviceController.createService(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Name, base price and unit are required fields'
        })
      );
    });
  });

  describe('updateService', () => {
    test('should update an existing service', async () => {
      req.params = { id: '1' };
      req.body = {
        name: 'Updated Service',
        beschreibung: 'Updated Description',
        preis_basis: '150.00',
        einheit: 'h',
        mwst_satz: '20',
        aktiv: true
      };

      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Check if service exists
      pool.query.mockResolvedValueOnce({}); // Update query
      pool.query.mockResolvedValueOnce({}); // Log activity

      await serviceController.updateService(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        serviceId: '1',
        message: 'Service updated successfully'
      });
    });

    test('should return 404 when service to update does not exist', async () => {
      req.params = { id: '999' };
      req.body = {
        name: 'Updated Service',
        beschreibung: 'Updated Description',
        preis_basis: '150.00',
        einheit: 'h',
        mwst_satz: '20',
        aktiv: true
      };

      pool.query.mockResolvedValueOnce({ rows: [] });

      await serviceController.updateService(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Service with ID 999 not found'
        })
      );
    });

    test('should return 400 when required fields are missing', async () => {
      req.params = { id: '1' };
      req.body = {
      beschreibung: 'Updated Description',
      mwst_satz: '20',
      aktiv: true
      };

      await serviceController.updateService(req, res, next);

      expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Name, base price and unit are required fields'
      })
      );
    });
  });

  describe('toggleServiceStatus', () => {
    test('should successfully toggle service status', async () => {
      req.params = { id: '1' };
      req.body = { aktiv: true };

      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Check if service exists
      pool.query.mockResolvedValueOnce({}); // Update status
      pool.query.mockResolvedValueOnce({}); // Log activity

      await serviceController.toggleServiceStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        serviceId: '1',
        message: 'Service activated successfully'
      });
    });

    test('should return 404 when service to toggle does not exist', async () => {
      req.params = { id: '999' };
      req.body = { aktiv: false };

      pool.query.mockResolvedValueOnce({ rows: [] });

      await serviceController.toggleServiceStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Service with ID 999 not found'
        })
      );
    });
  });

  describe('getServiceStatistics', () => {
    test('should return service statistics', async () => {
      req.params = { id: '1' };
      
      // Mock data for service validation
      pool.query.mockResolvedValueOnce({ rows: [{ name: 'Service 1' }] });
      
      // Mock data for revenue query
      pool.query.mockResolvedValueOnce({ 
        rows: [{ gesamtumsatz: '1000.00', rechnungsanzahl: '5' }] 
      });
      
      // Mock data for monthly revenue query
      pool.query.mockResolvedValueOnce({ 
        rows: [
          { monat: new Date('2023-01-01'), umsatz: '300.00' },
          { monat: new Date('2023-02-01'), umsatz: '700.00' }
        ] 
      });
      
      // Mock data for top customers query
      pool.query.mockResolvedValueOnce({ 
        rows: [
          { id: 1, name: 'Customer 1', umsatz: '600.00' },
          { id: 2, name: 'Customer 2', umsatz: '400.00' }
        ] 
      });

      await serviceController.getServiceStatistics(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        statistics: {
          name: 'Service 1',
          gesamtumsatz: '1000.00',
          rechnungsanzahl: 5,
          monatlicheUmsaetze: [
            { monat: 'formatted-date', umsatz: 300.0 },
            { monat: 'formatted-date', umsatz: 700.0 }
          ],
          topKunden: [
            { kundenId: 1, kundenName: 'Customer 1', umsatz: 600.0 },
            { kundenId: 2, kundenName: 'Customer 2', umsatz: 400.0 }
          ]
        }
      });
    });

    test('should return 404 when service for statistics does not exist', async () => {
      req.params = { id: '999' };
      pool.query.mockResolvedValueOnce({ rows: [] });

      await serviceController.getServiceStatistics(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Service with ID 999 not found'
        })
      );
    });
  });

  describe('exportServices', () => {
    test('should export services in JSON format', async () => {
      req.query = { format: 'json', status: 'aktiv' };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [
          { id: 1, name: 'Service 1', beschreibung: 'Description', preis_basis: '100.00', einheit: 'h', mwst_satz: '20', aktiv: true, created_at: new Date() }
        ] 
      });
      
      const mockExportData = { data: 'exported data' };
      exportService.generateExport.mockResolvedValueOnce(mockExportData);

      await serviceController.exportServices(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockExportData);
    });

    test('should export services in file format', async () => {
      req.query = { format: 'xlsx', status: 'aktiv' };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [
          { id: 1, name: 'Service 1', beschreibung: 'Description', preis_basis: '100.00', einheit: 'h', mwst_satz: '20', aktiv: true, created_at: new Date() }
        ] 
      });
      
      const mockExportData = { 
        buffer: Buffer.from('mock file content'),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: 'dienstleistungen-export.xlsx'
      };
      exportService.generateExport.mockResolvedValueOnce(mockExportData);

      await serviceController.exportServices(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', mockExportData.contentType);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', `attachment; filename="${mockExportData.filename}"`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockExportData.buffer);
    });

    test('should apply status filter for export', async () => {
      req.query = { format: 'json', status: 'inaktiv' };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [
          { id: 1, name: 'Service 1', beschreibung: 'Description', preis_basis: '100.00', einheit: 'h', mwst_satz: '20', aktiv: false, created_at: new Date() }
        ] 
      });
      
      const mockExportData = { data: 'exported data' };
      exportService.generateExport.mockResolvedValueOnce(mockExportData);

      await serviceController.exportServices(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockExportData);
    });

    test('should handle no data found for export', async () => {
      req.query = { format: 'json', status: 'aktiv' };
      
      pool.query.mockResolvedValueOnce({ rows: [] });
      exportService.generateExport.mockResolvedValueOnce({ data: [] });
      
      await serviceController.exportServices(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: [] });
    });

    test('should handle errors during export', async () => {
      req.query = { format: 'json', status: 'aktiv' };
      const error = new Error('Export error');
      pool.query.mockResolvedValueOnce({ rows: [] });
      exportService.generateExport.mockRejectedValueOnce(error);

      await serviceController.exportServices(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    test('should handle database errors when fetching services for export', async () => {
      req.query = { format: 'json', status: 'aktiv' };
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      await serviceController.exportServices(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
