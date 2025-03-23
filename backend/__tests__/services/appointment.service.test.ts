import { AppointmentService } from '../../services/appointment.service';
import { prisma } from '../../utils/prisma.utils';

// Mock the prisma client
jest.mock('../../utils/prisma.utils', () => ({
  prisma: {
    appointment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    appointmentNote: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    appointmentLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback()),
  },
}));

describe('Appointment Service', () => {
  let appointmentService: AppointmentService;
  
  beforeEach(() => {
    appointmentService = new AppointmentService();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('findAll', () => {
    it('should return appointments with pagination', async () => {
      // Arrange
      const filters = {
        status: 'geplant',
        date: '2025-02-01',
        search: 'meeting',
      };
      
      const paginationOptions = {
        page: 1,
        limit: 10,
      };
      
      const mockAppointments = [
        { id: 1, titel: 'Meeting 1', status: 'geplant' },
        { id: 2, titel: 'Meeting 2', status: 'geplant' },
      ];
      
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue(mockAppointments);
      (prisma.appointment.count as jest.Mock).mockResolvedValue(2);
      
      // Act
      const result = await appointmentService.findAll(filters, paginationOptions);
      
      // Assert
      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'geplant',
          }),
          skip: 0,
          take: 10,
        })
      );
      
      expect(result).toEqual({
        data: mockAppointments,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });
    });
  });
  
  describe('findByIdWithDetails', () => {
    it('should return appointment with notes', async () => {
      // Arrange
      const appointmentId = 1;
      const mockAppointment = {
        id: 1,
        titel: 'Important Meeting',
        status: 'geplant',
      };
      
      const mockNotes = [
        { id: 1, appointmentId: 1, text: 'Note 1', userName: 'User 1' },
        { id: 2, appointmentId: 1, text: 'Note 2', userName: 'User 2' },
      ];
      
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      (prisma.appointmentNote.findMany as jest.Mock).mockResolvedValue(mockNotes);
      
      // Act
      const result = await appointmentService.findByIdWithDetails(appointmentId);
      
      // Assert
      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: appointmentId },
        include: expect.any(Object),
      });
      
      expect(prisma.appointmentNote.findMany).toHaveBeenCalledWith({
        where: { appointmentId },
        orderBy: { createdAt: 'desc' },
      });
      
      expect(result).toEqual({
        ...mockAppointment,
        notes: mockNotes,
      });
    });
    
    it('should throw error if appointment not found and throwIfNotFound is true', async () => {
      // Arrange
      const appointmentId = 999;
      
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(
        appointmentService.findByIdWithDetails(appointmentId, { throwIfNotFound: true })
      ).rejects.toThrow();
    });
  });
  
  describe('create', () => {
    it('should create a new appointment and log activity', async () => {
      // Arrange
      const appointmentData = {
        titel: 'New Meeting',
        termin_datum: '2025-03-01',
        termin_zeit: '14:00',
        dauer: 60,
        status: 'geplant',
      };
      
      const userContext = {
        userId: 1,
        userName: 'Test User',
        userRole: 'admin',
        ipAddress: '127.0.0.1',
      };
      
      const mockCreatedAppointment = {
        id: 1,
        ...appointmentData,
      };
      
      (prisma.appointment.create as jest.Mock).mockResolvedValue(mockCreatedAppointment);
      (prisma.appointmentLog.create as jest.Mock).mockResolvedValue({ id: 1 });
      
      // Act
      const result = await appointmentService.create(appointmentData, { userContext });
      
      // Assert
      expect(prisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining(appointmentData),
      });
      
      expect(prisma.appointmentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          appointmentId: 1,
          userId: 1,
          userName: 'Test User',
          action: 'erstellt',
        }),
      });
      
      expect(result).toEqual(mockCreatedAppointment);
    });
  });
  
  describe('update', () => {
    it('should update an existing appointment and log activity', async () => {
      // Arrange
      const appointmentId = 1;
      const appointmentData = {
        titel: 'Updated Meeting Title',
        dauer: 90,
      };
      
      const userContext = {
        userId: 1,
        userName: 'Test User',
        userRole: 'admin',
        ipAddress: '127.0.0.1',
      };
      
      const mockExistingAppointment = {
        id: 1,
        titel: 'Original Meeting Title',
        dauer: 60,
        status: 'geplant',
      };
      
      const mockUpdatedAppointment = {
        ...mockExistingAppointment,
        ...appointmentData,
      };
      
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockExistingAppointment);
      (prisma.appointment.update as jest.Mock).mockResolvedValue(mockUpdatedAppointment);
      (prisma.appointmentLog.create as jest.Mock).mockResolvedValue({ id: 1 });
      
      // Act
      const result = await appointmentService.update(appointmentId, appointmentData, { userContext });
      
      // Assert
      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: appointmentId },
      });
      
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: appointmentData,
      });
      
      expect(prisma.appointmentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          appointmentId: 1,
          userId: 1,
          userName: 'Test User',
          action: 'aktualisiert',
        }),
      });
      
      expect(result).toEqual(mockUpdatedAppointment);
    });
    
    it('should throw error if appointment not found and throwIfNotFound is true', async () => {
      // Arrange
      const appointmentId = 999;
      
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(
        appointmentService.update(appointmentId, {}, { throwIfNotFound: true })
      ).rejects.toThrow();
    });
  });
  
  describe('updateStatus', () => {
    it('should update appointment status and log activity', async () => {
      // Arrange
      const appointmentId = 1;
      const newStatus = 'abgeschlossen';
      const statusNote = 'Appointment completed successfully';
      
      const userContext = {
        userId: 1,
        userName: 'Test User',
        userRole: 'admin',
        ipAddress: '127.0.0.1',
      };
      
      const mockExistingAppointment = {
        id: 1,
        titel: 'Meeting',
        status: 'geplant',
      };
      
      const mockUpdatedAppointment = {
        ...mockExistingAppointment,
        status: newStatus,
      };
      
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockExistingAppointment);
      (prisma.appointment.update as jest.Mock).mockResolvedValue(mockUpdatedAppointment);
      (prisma.appointmentLog.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.appointmentNote.create as jest.Mock).mockResolvedValue({ id: 1 });
      
      // Act
      const result = await appointmentService.updateStatus(appointmentId, newStatus, statusNote, { userContext });
      
      // Assert
      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: appointmentId },
      });
      
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: { status: newStatus },
      });
      
      expect(prisma.appointmentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          appointmentId: 1,
          userId: 1,
          userName: 'Test User',
          action: 'status_geändert',
          details: expect.stringContaining('geplant'),
        }),
      });
      
      expect(prisma.appointmentNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          appointmentId: 1,
          userId: 1,
          userName: 'Test User',
          text: statusNote,
        }),
      });
      
      expect(result).toEqual(mockUpdatedAppointment);
    });
  });
  
  describe('addNote', () => {
    it('should add a note to an appointment', async () => {
      // Arrange
      const appointmentId = 1;
      const noteText = 'This is a test note';
      
      const userContext = {
        userId: 1,
        userName: 'Test User',
        userRole: 'admin',
        ipAddress: '127.0.0.1',
      };
      
      const mockExistingAppointment = {
        id: 1,
        titel: 'Meeting',
        status: 'geplant',
      };
      
      const mockCreatedNote = {
        id: 1,
        appointmentId: 1,
        userId: 1,
        userName: 'Test User',
        text: noteText,
        createdAt: new Date(),
      };
      
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockExistingAppointment);
      (prisma.appointmentNote.create as jest.Mock).mockResolvedValue(mockCreatedNote);
      
      // Act
      const result = await appointmentService.addNote(appointmentId, noteText, { userContext });
      
      // Assert
      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: appointmentId },
      });
      
      expect(prisma.appointmentNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          appointmentId: 1,
          userId: 1,
          userName: 'Test User',
          text: noteText,
        }),
      });
      
      expect(result).toEqual(mockCreatedNote);
    });
    
    it('should throw error if appointment not found', async () => {
      // Arrange
      const appointmentId = 999;
      
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(
        appointmentService.addNote(appointmentId, 'Note text')
      ).rejects.toThrow();
    });
  });
  
  describe('delete', () => {
    it('should delete an appointment and log activity', async () => {
      // Arrange
      const appointmentId = 1;
      
      const userContext = {
        userId: 1,
        userName: 'Test User',
        userRole: 'admin',
        ipAddress: '127.0.0.1',
      };
      
      const mockExistingAppointment = {
        id: 1,
        titel: 'Meeting to Delete',
        status: 'geplant',
      };
      
      const mockDeletedAppointment = {
        id: 1,
        deleted: true,
      };
      
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockExistingAppointment);
      (prisma.appointment.delete as jest.Mock).mockResolvedValue(mockDeletedAppointment);
      (prisma.appointmentLog.create as jest.Mock).mockResolvedValue({ id: 1 });
      
      // Act
      const result = await appointmentService.delete(appointmentId, { userContext });
      
      // Assert
      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: appointmentId },
      });
      
      expect(prisma.appointment.delete).toHaveBeenCalledWith({
        where: { id: appointmentId },
      });
      
      expect(prisma.appointmentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          appointmentId: 1,
          userId: 1,
          userName: 'Test User',
          action: 'gelöscht',
        }),
      });
      
      expect(result).toEqual(mockDeletedAppointment);
    });
    
    it('should throw error if appointment not found and throwIfNotFound is true', async () => {
      // Arrange
      const appointmentId = 999;
      
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(
        appointmentService.delete(appointmentId, { throwIfNotFound: true })
      ).rejects.toThrow();
    });
  });
});