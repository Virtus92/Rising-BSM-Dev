import { IAppointmentService } from '../interfaces/IAppointmentService';
import { IAppointmentRepository } from '../interfaces/IAppointmentRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';
import { IValidationService } from '../interfaces/IValidationService';

/**
 * Service für die Verwaltung von Terminen
 */
export class AppointmentService implements IAppointmentService {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler,
    private validationService: IValidationService
  ) {}

  /**
   * Erstellt einen neuen Termin
   */
  async create(data: any, userId: number, userName: string) {
    try {
      this.logger.debug('AppointmentService.create', { title: data.title });
      
      // Validieren der Eingabedaten
      const validationResult = this.validateAppointmentData(data);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Metadaten hinzufügen
      const appointmentData = {
        ...data,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || 'planned'
      };
      
      // Termin erstellen
      const appointment = await this.appointmentRepository.create(appointmentData);
      
      // Aktivität loggen
      await this.appointmentRepository.logActivity(
        appointment.id,
        userId,
        userName,
        'create',
        `Termin "${appointment.title}" wurde erstellt`
      );
      
      // Notiz hinzufügen, wenn vorhanden
      if (data.note) {
        await this.appointmentRepository.addNote(
          appointment.id,
          userId,
          userName,
          data.note
        );
      }
      
      return appointment;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.create');
    }
  }

  /**
   * Findet einen Termin anhand seiner ID
   */
  async findById(id: number) {
    try {
      this.logger.debug('AppointmentService.findById', { id });
      
      const appointment = await this.appointmentRepository.findById(id);
      if (!appointment) {
        throw this.errorHandler.createError('Termin nicht gefunden', 404);
      }
      
      return appointment;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.findById');
    }
  }

  /**
   * Findet alle Termine mit optionaler Filterung
   */
  async findAll(filters?: any) {
    try {
      this.logger.debug('AppointmentService.findAll', filters);
      
      return await this.appointmentRepository.findAll(filters);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.findAll');
    }
  }

  /**
   * Findet Termine nach Kunde
   */
  async findByCustomer(customerId: number) {
    try {
      this.logger.debug('AppointmentService.findByCustomer', { customerId });
      
      return await this.appointmentRepository.findByCustomer(customerId);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.findByCustomer');
    }
  }

  /**
   * Findet Termine nach Projekt
   */
  async findByProject(projectId: number) {
    try {
      this.logger.debug('AppointmentService.findByProject', { projectId });
      
      return await this.appointmentRepository.findByProject(projectId);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.findByProject');
    }
  }

  /**
   * Findet Termine nach Zeitraum
   */
  async findByDateRange(startDate: Date, endDate: Date) {
    try {
      this.logger.debug('AppointmentService.findByDateRange', { startDate, endDate });
      
      return await this.appointmentRepository.findByDateRange(startDate, endDate);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.findByDateRange');
    }
  }

  /**
   * Aktualisiert einen Termin
   */
  async update(id: number, data: any, userId: number, userName: string) {
    try {
      this.logger.debug('AppointmentService.update', { id });
      
      // Überprüfen, ob der Termin existiert
      const existingAppointment = await this.appointmentRepository.findById(id, false);
      if (!existingAppointment) {
        throw this.errorHandler.createError('Termin nicht gefunden', 404);
      }
      
      // Validieren der Eingabedaten
      const validationResult = this.validateAppointmentData(data, true);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Notiz extrahieren, falls vorhanden
      const { note, ...updateData } = data;
      
      // Metadaten aktualisieren
      const appointmentData = {
        ...updateData,
        updatedAt: new Date()
      };
      
      // Termin aktualisieren
      const appointment = await this.appointmentRepository.update(id, appointmentData);
      
      // Aktivität loggen
      await this.appointmentRepository.logActivity(
        appointment.id,
        userId,
        userName,
        'update',
        `Termin "${appointment.title}" wurde aktualisiert`
      );
      
      // Notiz hinzufügen, wenn vorhanden
      if (note) {
        await this.appointmentRepository.addNote(
          appointment.id,
          userId,
          userName,
          note
        );
      }
      
      return appointment;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.update');
    }
  }

  /**
   * Ändert den Status eines Termins
   */
  async updateStatus(id: number, status: string, userId: number, userName: string) {
    try {
      this.logger.debug('AppointmentService.updateStatus', { id, status });
      
      // Überprüfen, ob der Termin existiert
      const existingAppointment = await this.appointmentRepository.findById(id, false);
      if (!existingAppointment) {
        throw this.errorHandler.createError('Termin nicht gefunden', 404);
      }
      
      // Validieren des Status
      if (!['planned', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        throw this.errorHandler.createError('Ungültiger Status', 400);
      }
      
      // Status aktualisieren
      const appointment = await this.appointmentRepository.update(id, {
        status,
        updatedAt: new Date()
      });
      
      // Aktivität loggen
      await this.appointmentRepository.logActivity(
        appointment.id,
        userId,
        userName,
        'status_update',
        `Status von Termin "${appointment.title}" wurde auf "${status}" geändert`
      );
      
      return appointment;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.updateStatus');
    }
  }

  /**
   * Löscht einen Termin
   */
  async delete(id: number, userId: number, userName: string) {
    try {
      this.logger.debug('AppointmentService.delete', { id });
      
      // Überprüfen, ob der Termin existiert
      const existingAppointment = await this.appointmentRepository.findById(id, false);
      if (!existingAppointment) {
        throw this.errorHandler.createError('Termin nicht gefunden', 404);
      }
      
      // Termin löschen (oder als gelöscht markieren)
      const result = await this.appointmentRepository.delete(id);
      
      // Aktivität loggen
      await this.appointmentRepository.logActivity(
        id,
        userId,
        userName,
        'delete',
        `Termin "${existingAppointment.title}" wurde gelöscht`
      );
      
      return result;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.delete');
    }
  }

  /**
   * Fügt eine Notiz zu einem Termin hinzu
   */
  async addNote(appointmentId: number, userId: number, userName: string, text: string) {
    try {
      this.logger.debug('AppointmentService.addNote', { appointmentId, userId });
      
      // Überprüfen, ob der Termin existiert
      const existingAppointment = await this.appointmentRepository.findById(appointmentId, false);
      if (!existingAppointment) {
        throw this.errorHandler.createError('Termin nicht gefunden', 404);
      }
      
      // Validierung des Notiz-Textes
      if (!text) {
        throw this.errorHandler.createError('Notiztext ist erforderlich', 400);
      }
      
      if (text.trim().length === 0) {
        throw this.errorHandler.createError('Notiztext darf nicht leer sein', 400);
      }
      
      // Notiz hinzufügen
      const note = await this.appointmentRepository.addNote(appointmentId, userId, userName, text);
      
      // Aktivität loggen
      await this.appointmentRepository.logActivity(
        appointmentId,
        userId,
        userName,
        'add_note',
        `Notiz zu Termin "${existingAppointment.title}" hinzugefügt`
      );
      
      return note;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.addNote');
    }
  }

  /**
   * Holt Notizen für einen Termin
   */
  async getAppointmentNotes(appointmentId: number) {
    try {
      this.logger.debug('AppointmentService.getAppointmentNotes', { appointmentId });
      
      // Überprüfen, ob der Termin existiert
      const existingAppointment = await this.appointmentRepository.findById(appointmentId, false);
      if (!existingAppointment) {
        throw this.errorHandler.createError('Termin nicht gefunden', 404);
      }
      
      return await this.appointmentRepository.getAppointmentNotes(appointmentId);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.getAppointmentNotes');
    }
  }

  /**
   * Validiert Termindaten für die Erstellung/Aktualisierung
   */
  validateAppointmentData(data: any, isUpdate = false): { isValid: boolean; errors?: any } {
    const validationRules = {
      title: {
        required: !isUpdate,
        type: 'string',
        minLength: 3,
        maxLength: 200
      },
      appointmentDate: {
        required: !isUpdate,
        type: 'date'
      },
      duration: {
        type: 'number',
        min: 0
      },
      customerId: {
        type: 'number'
      },
      projectId: {
        type: 'number'
      },
      location: {
        type: 'string',
        maxLength: 200
      },
      description: {
        type: 'string'
      },
      status: {
        type: 'string',
        enum: ['planned', 'confirmed', 'in_progress', 'completed', 'cancelled']
      }
    };
    
    return this.validationService.validate(data, validationRules);
  }

  /**
   * Holt bevorstehende Termine
   */
  async getUpcomingAppointments(limit = 5) {
    try {
      this.logger.debug('AppointmentService.getUpcomingAppointments', { limit });
      
      return await this.appointmentRepository.getUpcomingAppointments(limit);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.getUpcomingAppointments');
    }
  }

  /**
   * Holt Terminstatistiken
   */
  async getAppointmentStatistics() {
    try {
      this.logger.debug('AppointmentService.getAppointmentStatistics');
      
      const statusCounts = await this.appointmentRepository.countByStatus();
      
      // Termine für die kommende Woche zählen
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const upcomingAppointments = await this.appointmentRepository.findByDateRange(today, nextWeek);
      
      return {
        statusCounts,
        upcomingWeek: upcomingAppointments.length
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentService.getAppointmentStatistics');
    }
  }
}
