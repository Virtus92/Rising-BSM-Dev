import { Request, Response } from 'express';
import { BaseController } from '../core/BaseController.js';
import { IAppointmentController } from '../interfaces/IAppointmentController.js';
import { IAppointmentService } from '../interfaces/IAppointmentService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { Appointment } from '../entities/Appointment.js';
import { 
  AppointmentCreateDto, 
  AppointmentUpdateDto, 
  AppointmentResponseDto,
  AppointmentStatusUpdateDto,
  AppointmentNoteDto,
  AppointmentFilterParams
} from '../dtos/AppointmentDtos.js';
import { AuthenticatedRequest } from '../interfaces/IAuthTypes.js';

/**
 * Controller implementation for appointments
 * Handles HTTP requests for appointment-related operations
 */
export class AppointmentController extends BaseController<
  Appointment,
  AppointmentCreateDto,
  AppointmentUpdateDto,
  AppointmentResponseDto
> implements IAppointmentController {
  /**
   * Creates a new AppointmentController instance
   * 
   * @param service - Appointment service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly appointmentService: IAppointmentService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(appointmentService, logger, errorHandler);
    
    // Bind methods to preserve 'this' context
    this.getDetails = this.getDetails.bind(this);
    this.findAppointments = this.findAppointments.bind(this);
    this.getUpcoming = this.getUpcoming.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.addNote = this.addNote.bind(this);
    this.getNotes = this.getNotes.bind(this);
    
    this.logger.debug('Initialized AppointmentController');
  }

  /**
   * Override create method to handle date and time conversion
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as AppointmentCreateDto;
      const options = this.extractQueryOptions(req);
      
      // Create appointment with context
      const entity = await this.appointmentService.createFromDateAndTime(data, {
        ...options,
        context: {
          ...options.context,
          userId: this.getAuthenticatedUser(req)?.id,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendCreatedResponse(res, entity, 'Termin erfolgreich erstellt');
    } catch (error) {
      this.handleError(error, res, 'Fehler beim Erstellen des Termins');
    }
  }

  /**
   * Override update method to handle date and time conversion
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.extractIdParam(req);
      const data = req.body as AppointmentUpdateDto;
      const options = this.extractQueryOptions(req);
      
      // Update appointment with context
      const entity = await this.appointmentService.updateWithDateAndTime(id, data, {
        ...options,
        context: {
          ...options.context,
          userId: this.getAuthenticatedUser(req)?.id,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(res, entity, 'Termin erfolgreich aktualisiert');
    } catch (error) {
      this.handleError(error, res, 'Fehler beim Aktualisieren des Termins');
    }
  }

  /**
   * Get detailed appointment information
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const id = this.extractIdParam(req);
      const options = this.extractQueryOptions(req);
      
      // Get appointment details from service
      const entity = await this.appointmentService.getAppointmentDetails(id, options);
      
      if (!entity) {
        throw this.errorHandler.createNotFoundError(`Termin mit ID ${id} nicht gefunden`);
      }
      
      // Send response
      this.sendSuccessResponse(res, entity, 'Termindetails erfolgreich abgerufen');
    } catch (error) {
      this.handleError(error, res, 'Fehler beim Abrufen der Termindetails');
    }
  }

  /**
   * Find appointments with filtering
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async findAppointments(req: Request, res: Response): Promise<void> {
    try {
      // Extract filter parameters from query
      const filters: AppointmentFilterParams = {
        status: req.query.status as any,
        date: req.query.date as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as string,
        sortDirection: req.query.sortDirection as 'asc' | 'desc'
      };
      
      // Get appointments from service
      const result = await this.appointmentService.findAppointments(filters);
      
      // Send response
      this.sendPaginatedResponse(
        res,
        result.data,
        result.pagination,
        'Termine erfolgreich abgerufen',
        { filters }
      );
    } catch (error) {
      this.handleError(error, res, 'Fehler beim Suchen von Terminen');
    }
  }

  /**
   * Get upcoming appointments
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getUpcoming(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const options = this.extractQueryOptions(req);
      
      // Get upcoming appointments from service
      const entities = await this.appointmentService.findUpcoming(limit, options);
      
      // Send response
      this.sendSuccessResponse(res, entities, 'Anstehende Termine erfolgreich abgerufen');
    } catch (error) {
      this.handleError(error, res, 'Fehler beim Abrufen der anstehenden Termine');
    }
  }

  /**
   * Update appointment status
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = this.extractIdParam(req);
      const statusData = req.body as AppointmentStatusUpdateDto;
      const options = this.extractQueryOptions(req);
      
      // Update status with context
      const entity = await this.appointmentService.updateStatus(id, statusData, {
        ...options,
        context: {
          ...options.context,
          userId: this.getAuthenticatedUser(req)?.id,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(
        res,
        {
          id: entity.id,
          status: entity.status,
          statusLabel: entity.statusLabel,
          statusClass: entity.statusClass
        },
        'Terminstatus erfolgreich aktualisiert'
      );
    } catch (error) {
      this.handleError(error, res, 'Fehler beim Aktualisieren des Terminstatus');
    }
  }

  /**
   * Add note to appointment
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async addNote(req: Request, res: Response): Promise<void> {
    try {
      const id = this.extractIdParam(req);
      const { note } = req.body as AppointmentNoteDto;
      
      if (!note || typeof note !== 'string' || note.trim() === '') {
        throw this.errorHandler.createValidationError(
          'Ungültige Notiz',
          ['Notiz darf nicht leer sein']
        );
      }
      
      // Get authenticated user
      const user = this.getAuthenticatedUser(req);
      
      if (!user) {
        throw this.errorHandler.createUnauthorizedError('Benutzer nicht authentifiziert');
      }
      
      // Add note to appointment
      const created = await this.appointmentService.addNote(
        id,
        note,
        user.id,
        user.name,
        { context: { userId: user.id, ipAddress: req.ip } }
      );
      
      // Send response
      this.sendCreatedResponse(res, created, 'Notiz erfolgreich hinzugefügt');
    } catch (error) {
      this.handleError(error, res, 'Fehler beim Hinzufügen der Notiz');
    }
  }

  /**
   * Get appointment notes
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getNotes(req: Request, res: Response): Promise<void> {
    try {
      const id = this.extractIdParam(req);
      const options = this.extractQueryOptions(req);
      
      // Get notes from service
      const notes = await this.appointmentService.getNotes(id, options);
      
      // Send response
      this.sendSuccessResponse(res, notes, 'Notizen erfolgreich abgerufen');
    } catch (error) {
      this.handleError(error, res, 'Fehler beim Abrufen der Notizen');
    }
  }

  /**
   * Get authenticated user from request
   * 
   * @param req - HTTP request
   * @returns Authenticated user or null
   */
  protected getAuthenticatedUser(req: Request): AuthenticatedRequest['user'] | null {
    return (req as AuthenticatedRequest).user || null;
  }
}
