const appointmentController = require('../../controllers/appointment.controller');
const pool = require('../../services/db.service');
const exportService = require('../../services/export.service');

// Mock dependencies
jest.mock('../../services/db.service');
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

  describe('getAllAppointments', () => {
    it('should return appointments with pagination and apply filters', async () => {
      // Mock query parameters
      mockReq.query = {
        page: '1',
        limit: '10',
        status: 'geplant',
        date: '2023-06-10',
        search: 'meeting'
      };

      // Mock database responses
      pool.query.mockImplementation((query, params) => {
        if (query.includes('COUNT(*)')) {
          return Promise.resolve({ rows: [{ total: '5' }] });
        } else {
          return Promise.resolve({
            rows: [
              {
                id: 1,
                titel: 'Client Meeting',
                kunde_id: 42,
                kunde_name: 'ACME Inc.',
                projekt_id: 100,
                projekt_titel: 'Office Renovation',
                termin_datum: '2023-06-10T10:00:00Z',
                dauer: 60,
                ort: 'Office',
                status: 'geplant'
              },
              {
                id: 2,
                titel: 'Follow-up Meeting',
                kunde_id: 42,
                kunde_name: 'ACME Inc.',
                projekt_id: 100,
                projekt_titel: 'Office Renovation',
                termin_datum: '2023-06-10T14:00:00Z',
                dauer: 30,
                ort: 'Video Call',
                status: 'geplant'
              }
            ]
          });
        }
      });

      // Execute the controller method
      const result = await appointmentController.getAllAppointments(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('appointments');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('filters');
      expect(result.appointments).toHaveLength(2);
      expect(result.pagination.total).toBe(1); // Math.ceil(5/10)
      expect(result.pagination.current).toBe(1);
      expect(result.filters.status).toBe('geplant');
      expect(result.filters.date).toBe('2023-06-10');
      expect(result.appointments[0].titel).toBe('Client Meeting');
      expect(result.appointments[0].statusLabel).toBe('Geplant');
    });

    it('should handle errors', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      // Execute the controller method
      await appointmentController.getAllAppointments(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].success).toBe(false);
    });
  });

  describe('getAppointmentById', () => {
    it('should return appointment details with notes', async () => {
      // Mock request params
      mockReq.params = { id: '1' };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text.includes('SELECT t.*, k.name')) {
          return Promise.resolve({ 
            rows: [{ 
              id: 1, 
              titel: 'Client Meeting', 
              kunde_id: 42,
              kunde_name: 'ACME Inc.',
              projekt_id: 100,
              projekt_titel: 'Office Renovation',
              termin_datum: '2023-06-10T10:00:00Z',
              dauer: 60,
              ort: 'Office',
              beschreibung: 'Initial client consultation',
              status: 'geplant'
            }] 
          });
        } else if (query.text.includes('termin_notizen')) {
          return Promise.resolve({
            rows: [
              { 
                id: 1, 
                text: 'Appointment note', 
                erstellt_am: '2023-06-05T15:30:00Z',
                benutzer_name: 'Admin User'
              }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Execute the controller method
      await appointmentController.getAppointmentById(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockRes.json.mock.calls[0][0]).toHaveProperty('appointment');
      expect(mockRes.json.mock.calls[0][0]).toHaveProperty('notes');
      expect(mockRes.json.mock.calls[0][0].appointment.id).toBe(1);
      expect(mockRes.json.mock.calls[0][0].appointment.titel).toBe('Client Meeting');
      expect(mockRes.json.mock.calls[0][0].appointment.kunde_name).toBe('ACME Inc.');
      expect(mockRes.json.mock.calls[0][0].appointment.statusLabel).toBe('Geplant');
      expect(mockRes.json.mock.calls[0][0].notes).toHaveLength(1);
      expect(mockRes.json.mock.calls[0][0].notes[0].text).toBe('Appointment note');
    });

    it('should handle appointment not found', async () => {
      // Mock request params
      mockReq.params = { id: '999' };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await appointmentController.getAppointmentById(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
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
      pool.query.mockImplementation((query) => {
        if (query.text && query.text.includes('INSERT INTO termine')) {
          return Promise.resolve({ rows: [{ id: 3 }] });
        }
        return Promise.resolve({ rows: [] });
      });

      // Execute the controller method
      const result = await appointmentController.createAppointment(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(2); // Insert + log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('appointmentId', 3);
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
      pool.query.mockImplementation((query) => {
        if (query.text === 'SELECT id FROM termine WHERE id = $1') {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      // Execute the controller method
      const result = await appointmentController.updateAppointment(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Check + Update appointment + Log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('appointmentId', '1');
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
      pool.query.mockResolvedValueOnce({ rows: [] });

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
      pool.query.mockResolvedValue({ rowCount: 1 });

      // Execute the controller method
      const result = await appointmentController.updateAppointmentStatus(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Update status + Add note + Log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('appointmentId', '1');
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
      pool.query.mockImplementation((query) => {
        if (query.text === 'SELECT id FROM termine WHERE id = $1') {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      // Execute the controller method
      const result = await appointmentController.addAppointmentNote(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Check + Insert note + Log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('appointmentId', '1');
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
      pool.query.mockResolvedValueOnce({
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
      exportService.generateExport.mockResolvedValueOnce({
        filename: 'termine-export.xlsx',
        content: Buffer.from('mock-excel-content')
      });

      // Execute the controller method
      const result = await appointmentController.exportAppointments(mockReq, mockRes, mockNext);

      // Assertions
      expect(exportService.generateExport).toHaveBeenCalled();
      expect(result).toHaveProperty('filename', 'termine-export.xlsx');
    });
  });
});