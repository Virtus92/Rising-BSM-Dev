import express from 'express';
import request from 'supertest';
import { createTestApp, authRequest } from './setup';
import appointmentRoutes from '../../routes/appointment.routes';
import { appointmentService } from '../../services/appointment.service';

// Mock the service
jest.mock('../../services/appointment.service', () => ({
  appointmentService: {
    findAll: jest.fn(),
    findByIdWithDetails: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    addNote: jest.fn()
  }
}));

describe('Appointment API', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
    app.use('/api/appointments', appointmentRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/appointments', () => {
    it('should return a list of appointments', async () => {
      // Arrange
      const mockAppointments = [
        { id: 1, title: 'Appointment 1' },
        { id: 2, title: 'Appointment 2' }
      ];
      
      (appointmentService.findAll as jest.Mock).mockResolvedValue({
        data: mockAppointments,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1
        }
      });

      // Act
      const response = await authRequest.get(app, '/api/appointments');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockAppointments
      }));
    });

    it('should apply filters from query parameters', async () => {
      // Arrange
      (appointmentService.findAll as jest.Mock).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      });

      // Act
      await authRequest.get(app, '/api/appointments?status=geplant&date=2025-03-01&search=test');

      // Assert
      expect(appointmentService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ 
          status: 'geplant', 
          date: '2025-03-01', 
          search: 'test' 
        }),
        expect.any(Object)
      );
    });
  });

  describe('GET /api/appointments/:id', () => {
    it('should return a single appointment', async () => {
      // Arrange
      const mockAppointment = { 
        id: 1, 
        title: 'Test Appointment',
        notes: []
      };
      
      (appointmentService.findByIdWithDetails as jest.Mock).mockResolvedValue(mockAppointment);

      // Act
      const response = await authRequest.get(app, '/api/appointments/1');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockAppointment
      }));
      expect(appointmentService.findByIdWithDetails).toHaveBeenCalledWith(1, { throwIfNotFound: true });
    });

    it('should return 400 for invalid ID', async () => {
      // Act
      const response = await authRequest.get(app, '/api/appointments/invalid');

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/appointments', () => {
    it('should create a new appointment', async () => {
      // Arrange
      const appointmentData = {
        titel: 'New Appointment',
        termin_datum: '2025-05-01',
        termin_zeit: '14:00',
        dauer: 60,
        kunde_id: 1
      };
      
      const mockCreatedAppointment = {
        id: 1,
        ...appointmentData
      };
      
      (appointmentService.create as jest.Mock).mockResolvedValue(mockCreatedAppointment);

      // Act
      const response = await authRequest.post(app, '/api/appointments', appointmentData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockCreatedAppointment
      }));
      expect(appointmentService.create).toHaveBeenCalledWith(
        appointmentData,
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
    });

    it('should return 400 for invalid appointment data', async () => {
      // Arrange
      const invalidData = {
        // Missing required fields
      };

      // Act
      const response = await authRequest.post(app, '/api/appointments', invalidData);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/appointments/:id', () => {
    it('should update an existing appointment', async () => {
      // Arrange
      const appointmentData = {
        titel: 'Updated Appointment',
        termin_datum: '2025-05-02',
        termin_zeit: '15:00'
      };
      
      const mockUpdatedAppointment = {
        id: 1,
        ...appointmentData
      };
      
      (appointmentService.update as jest.Mock).mockResolvedValue(mockUpdatedAppointment);

      // Act
      const response = await authRequest.put(app, '/api/appointments/1', appointmentData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockUpdatedAppointment
      }));
      expect(appointmentService.update).toHaveBeenCalledWith(
        1,
        appointmentData,
        expect.objectContaining({
          userContext: expect.any(Object),
          throwIfNotFound: true
        })
      );
    });
  });

  describe('PATCH /api/appointments/:id/status', () => {
    it('should update appointment status', async () => {
      // Arrange
      const statusData = {
        status: 'abgeschlossen',
        note: 'Status note'
      };
      
      const mockUpdatedAppointment = {
        id: 1,
        status: 'abgeschlossen'
      };
      
      (appointmentService.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedAppointment);

      // Act
      const response = await authRequest.patch(app, '/api/appointments/1/status', statusData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockUpdatedAppointment
      }));
      expect(appointmentService.updateStatus).toHaveBeenCalledWith(
        1,
        'abgeschlossen',
        'Status note',
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
    });
  });

  describe('POST /api/appointments/:id/notes', () => {
    it('should add a note to an appointment', async () => {
      // Arrange
      const noteData = {
        note: 'Test note for appointment'
      };
      
      const mockNote = {
        id: 1,
        appointmentId: 1,
        text: 'Test note for appointment',
        userName: 'Test User',
        createdAt: new Date().toISOString()
      };
      
      (appointmentService.addNote as jest.Mock).mockResolvedValue(mockNote);

      // Act
      const response = await authRequest.post(app, '/api/appointments/1/notes', noteData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockNote
      }));
      expect(appointmentService.addNote).toHaveBeenCalledWith(
        1,
        'Test note for appointment',
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
    });

    it('should return 400 for empty note', async () => {
      // Arrange
      const invalidNote = {
        note: ''
      };

      // Act
      const response = await authRequest.post(app, '/api/appointments/1/notes', invalidNote);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/appointments/:id', () => {
    it('should delete an appointment', async () => {
      // Arrange
      const mockDeletedAppointment = {
        id: 1,
        deleted: true
      };
      
      (appointmentService.delete as jest.Mock).mockResolvedValue(mockDeletedAppointment);

      // Act
      const response = await authRequest.delete(app, '/api/appointments/1');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockDeletedAppointment
      }));
      expect(appointmentService.delete).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          userContext: expect.any(Object),
          throwIfNotFound: true
        })
      );
    });
  });
});