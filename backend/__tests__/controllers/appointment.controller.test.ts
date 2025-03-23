import { Request, Response } from 'express';
import { 
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  addAppointmentNote
} from '../../controllers/appointment.controller';
import { appointmentService } from '../../services/appointment.service';

// Mock the appointmentService
jest.mock('../../services/appointment.service', () => ({
  appointmentService: {
    findAll: jest.fn(),
    findByIdWithDetails: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    addNote: jest.fn(),
  }
}));

// Mock Response object
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Appointment Controller', () => {
  let req: Partial<Request>;
  let res: Response;

  beforeEach(() => {
    req = {};
    res = mockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAppointments', () => {
    it('should get all appointments with filters', async () => {
      // Arrange
      req.query = { 
        status: 'geplant', 
        date: '2025-02-01', 
        search: 'test', 
        page: '1', 
        limit: '10' 
      };
      
      const mockAppointments = [
        { id: 1, title: 'Appointment 1' },
        { id: 2, title: 'Appointment 2' }
      ];
      
      const mockPagination = {
        total: 2,
        page: 1,
        limit: 10,
        pages: 1
      };
      
      (appointmentService.findAll as jest.Mock).mockResolvedValue({
        data: mockAppointments,
        pagination: mockPagination
      });

      // Act
      await getAllAppointments(req as Request, res);

      // Assert
      expect(appointmentService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'geplant',
          date: '2025-02-01',
          search: 'test',
          page: 1,
          limit: 10
        }),
        expect.objectContaining({
          page: 1,
          limit: 10
        })
      );
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockAppointments,
        pagination: mockPagination
      }));
    });
  });

  describe('getAppointmentById', () => {
    it('should get appointment by id', async () => {
      // Arrange
      req.params = { id: '1' };
      
      const mockAppointment = { 
        id: 1, 
        title: 'Test Appointment',
        notes: [
          { id: 1, text: 'Test note' }
        ]
      };
      
      (appointmentService.findByIdWithDetails as jest.Mock).mockResolvedValue(mockAppointment);

      // Act
      await getAppointmentById(req as Request, res);

      // Assert
      expect(appointmentService.findByIdWithDetails).toHaveBeenCalledWith(1, { throwIfNotFound: true });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockAppointment
      }));
    });

    it('should return 400 if id is invalid', async () => {
      // Arrange
      req.params = { id: 'invalid' };

      // Act & Assert
      await expect(getAppointmentById(req as Request, res)).rejects.toThrow();
    });
  });

  describe('createAppointment', () => {
    it('should create a new appointment', async () => {
      // Arrange
      const appointmentData = {
        titel: 'New Appointment',
        termin_datum: '2025-03-01',
        termin_zeit: '14:00',
        dauer: 60
      };
      
      req.body = appointmentData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockCreatedAppointment = { 
        id: 1, 
        ...appointmentData 
      };
      
      (appointmentService.create as jest.Mock).mockResolvedValue(mockCreatedAppointment);

      // Act
      await createAppointment(req as any, res);

      // Assert
      expect(appointmentService.create).toHaveBeenCalledWith(
        appointmentData,
        expect.objectContaining({
          userContext: expect.objectContaining({
            userId: 1,
            userName: 'Test User',
            userRole: 'admin'
          })
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockCreatedAppointment
      }));
    });
  });

  describe('updateAppointment', () => {
    it('should update an existing appointment', async () => {
      // Arrange
      req.params = { id: '1' };
      const appointmentData = {
        titel: 'Updated Appointment',
        termin_datum: '2025-03-01',
        termin_zeit: '15:00'
      };
      
      req.body = appointmentData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockUpdatedAppointment = { 
        id: 1, 
        ...appointmentData 
      };
      
      (appointmentService.update as jest.Mock).mockResolvedValue(mockUpdatedAppointment);

      // Act
      await updateAppointment(req as any, res);

      // Assert
      expect(appointmentService.update).toHaveBeenCalledWith(
        1,
        appointmentData,
        expect.objectContaining({
          userContext: expect.any(Object),
          throwIfNotFound: true
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUpdatedAppointment
      }));
    });
  });

  describe('deleteAppointment', () => {
    it('should delete an appointment', async () => {
      // Arrange
      req.params = { id: '1' };
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockDeletedAppointment = { id: 1 };
      
      (appointmentService.delete as jest.Mock).mockResolvedValue(mockDeletedAppointment);

      // Act
      await deleteAppointment(req as any, res);

      // Assert
      expect(appointmentService.delete).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          userContext: expect.any(Object),
          throwIfNotFound: true
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockDeletedAppointment
      }));
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should update appointment status', async () => {
      // Arrange
      const statusData = {
        id: 1,
        status: 'abgeschlossen',
        note: 'Status update note'
      };
      
      req.body = statusData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockUpdatedAppointment = { 
        id: 1, 
        status: 'abgeschlossen'
      };
      
      (appointmentService.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedAppointment);

      // Act
      await updateAppointmentStatus(req as any, res);

      // Assert
      expect(appointmentService.updateStatus).toHaveBeenCalledWith(
        1,
        'abgeschlossen',
        'Status update note',
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUpdatedAppointment
      }));
    });
  });

  describe('addAppointmentNote', () => {
    it('should add a note to an appointment', async () => {
      // Arrange
      req.params = { id: '1' };
      req.body = { note: 'New note for appointment' };
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockAddedNote = { 
        id: 1, 
        appointmentId: 1,
        text: 'New note for appointment',
        userId: 1,
        userName: 'Test User'
      };
      
      (appointmentService.addNote as jest.Mock).mockResolvedValue(mockAddedNote);

      // Act
      await addAppointmentNote(req as any, res);

      // Assert
      expect(appointmentService.addNote).toHaveBeenCalledWith(
        1,
        'New note for appointment',
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockAddedNote
      }));
    });
  });
});