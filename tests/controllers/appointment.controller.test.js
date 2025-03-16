const appointmentController = require('../../controllers/appointment.controller');
const { mockRequest, mockResponse, mockDbClient } = require('../setup');
const exportService = require('../../services/export.service');
const helpers = require('../../utils/helpers');

// Keep existing mocks
jest.mock('../../services/export.service');
jest.mock('../../utils/helpers', () => ({
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

describe('Appointment Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Initialize mock request and response for each test
    mockReq = mockRequest();
    mockRes = mockResponse();
    mockNext = jest.fn();
    
    // Reset mock implementations
    jest.clearAllMocks();

    // Setup default mock DB client implementation
    mockDbClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  describe('createAppointment', () => {
    it('should create a new appointment', async () => {
      // Mock request body
      mockReq.body = {
        titel: 'New Meeting',
        kunde_id: '42',
        projekt_id: '100',
        termin_datum: '2023-07-15',
        termin_zeit: '14:30',
        dauer: '60',
        ort: 'Office',
        beschreibung: 'Follow-up meeting',
        status: 'geplant'
      };

      // Mock database responses
      mockDbClient.query.mockImplementation((query) => {
        if (query.includes('INSERT INTO termine')) {
          return Promise.resolve({ rows: [{ id: 3 }] });
        }
        return Promise.resolve({ rows: [] });
      });

      // Execute the controller method
      await appointmentController.createAppointment(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockDbClient.query).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          appointmentId: 3
        })
      );
    });

    it('should validate required fields', async () => {
      // Mock request body with missing fields
      mockReq.body = {
        titel: '', // Missing title
        // Missing date and time
        dauer: '60'
      };

      // Execute the controller method
      await appointmentController.createAppointment(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should validate date format', async () => {
      // Mock request body with invalid date
      mockReq.body = {
        titel: 'Meeting',
        termin_datum: 'not-a-date', // Invalid date
        termin_zeit: '14:30'
      };

      // Execute the controller method
      await appointmentController.createAppointment(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('Invalid date format');
    });

    it('should validate time format', async () => {
      // Mock request body with invalid time
      mockReq.body = {
        titel: 'Meeting',
        termin_datum: '2023-07-15',
        termin_zeit: '25:00' // Invalid time
      };

      // Execute the controller method
      await appointmentController.createAppointment(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('Invalid time format');
    });
  });

  describe('updateAppointment', () => {
    it('should update an existing appointment', async () => {
      // Mock request params and body
      mockReq.params = { id: '1' };
      mockReq.body = {
        titel: 'Updated Meeting',
        kunde_id: '42',
        projekt_id: '100',
        termin_datum: '2023-07-15',
        termin_zeit: '15:30',
        dauer: '90',
        ort: 'Conference Room',
        beschreibung: 'Updated description',
        status: 'bestaetigt'
      };

      // Mock database responses
      mockDbClient.query.mockImplementation((query, params) => {
        if (query.includes('SELECT id FROM termine WHERE id = $1')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      // Execute the controller method
      await appointmentController.updateAppointment(mockReq, mockRes, mockNext);

      // Assertions - check that res.json was called with the right data
      expect(mockDbClient.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          appointmentId: '1'
        })
      );
    });

    it('should handle appointment not found', async () => {
      // Mock request params
      mockReq.params = { id: '999' };
      mockReq.body = {
        titel: 'Updated Meeting',
        termin_datum: '2023-07-15',
        termin_zeit: '15:30'
      };

      // Mock empty database response
      mockDbClient.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await appointmentController.updateAppointment(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should update appointment status and add note if provided', async () => {
      // Mock request body
      mockReq.body = {
        id: '1',
        status: 'abgeschlossen',
        note: 'Meeting completed successfully'
      };

      // Mock database responses
      mockDbClient.query.mockResolvedValue({ rowCount: 1 });

      // Execute the controller method
      await appointmentController.updateAppointmentStatus(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockDbClient.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          appointmentId: '1'
        })
      );
    });

    it('should validate status value', async () => {
      // Mock request body with invalid status
      mockReq.body = {
        id: '1',
        status: 'invalid_status'
      };

      // Execute the controller method
      await appointmentController.updateAppointmentStatus(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid status value');
    });
  });

  describe('addAppointmentNote', () => {
    it('should add a note to an appointment', async () => {
      // Mock request params and body
      mockReq.params = { id: '1' };
      mockReq.body = { note: 'New appointment note' };

      // Mock database responses
      mockDbClient.query.mockImplementation((query) => {
        if (query.includes('SELECT id FROM termine WHERE id = $1')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      // Execute the controller method
      await appointmentController.addAppointmentNote(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockDbClient.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          appointmentId: '1'
        })
      );
    });

    it('should validate note content', async () => {
      // Mock request params and body with empty note
      mockReq.params = { id: '1' };
      mockReq.body = { note: '' };

      // Execute the controller method
      await appointmentController.addAppointmentNote(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('empty');
    });
  });

  describe('exportAppointments', () => {
    it('should export appointments data', async () => {
      // Mock request query
      mockReq.query = { 
        format: 'xlsx', 
        start_date: '2023-06-01', 
        end_date: '2023-06-30',
        status: 'geplant'
      };

      // Mock database response
      mockDbClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            titel: 'Client Meeting',
            termin_datum: '2023-06-10T10:00:00Z',
            dauer: 60,
            ort: 'Office',
            status: 'geplant',
            beschreibung: 'Initial consultation',
            kunde_name: 'ACME Inc.',
            projekt_titel: 'Office Renovation'
          }
        ]
      });

      // Mock export service
      const mockExportResult = {
        filename: 'termine-export.xlsx',
        content: Buffer.from('mock-excel-content'),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
      exportService.generateExport.mockResolvedValueOnce(mockExportResult);

      // Execute the controller method
      await appointmentController.exportAppointments(mockReq, mockRes, mockNext);

      // Assertions
      expect(exportService.generateExport).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', mockExportResult.contentType);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('termine-export.xlsx'));
      expect(mockRes.send).toHaveBeenCalledWith(mockExportResult.content);
    });
  });
});