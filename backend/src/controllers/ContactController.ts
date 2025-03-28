import { Request, Response } from 'express';
import { IContactService } from '../interfaces/IContactService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { BaseController } from '../core/BaseController.js';
import { IContactController } from '../interfaces/IContactController.js';
import { 
  CreateContactRequestDto, 
  UpdateContactRequestStatusDto, 
  AddContactRequestNoteDto, 
  ContactRequestFilterParams 
} from '../dtos/ContactDtos.js';

/**
 * ContactController
 * 
 * Controller for handling contact request-related HTTP requests.
 */
export class ContactController extends BaseController implements IContactController {
  /**
   * Creates a new ContactController instance
   * 
   * @param contactService - Contact service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly contactService: IContactService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(logger, errorHandler);
    
    // Bind methods to preserve 'this' context when used as route handlers
    this.submitContactRequest = this.submitContactRequest.bind(this);
    this.getAllContactRequests = this.getAllContactRequests.bind(this);
    this.getContactRequestById = this.getContactRequestById.bind(this);
    this.updateContactRequestStatus = this.updateContactRequestStatus.bind(this);
    this.addContactRequestNote = this.addContactRequestNote.bind(this);
    
    this.logger.debug('Initialized ContactController');
  }

  /**
   * Submit a new contact request (public endpoint)
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async submitContactRequest(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateContactRequestDto = req.body;
      
      // Basic validation
      if (!data.name || !data.email || !data.service || !data.message) {
        throw this.errorHandler.createValidationError('Invalid contact request data', [
          'Name, email, service, and message are required'
        ]);
      }
      
      // Create contact request with client IP
      const contactRequest = await this.contactService.createContactRequest(data, {
        context: {
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendCreatedResponse(res, 
        {
          id: contactRequest.id,
          name: contactRequest.name,
          email: contactRequest.email,
          service: contactRequest.service,
          message: contactRequest.message,
          createdAt: contactRequest.createdAt
        }, 
        'Contact request submitted successfully'
      );
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Get all contact requests (admin only)
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getAllContactRequests(req: Request, res: Response): Promise<void> {
    try {
      // Extract query parameters
      const filters: ContactRequestFilterParams = {
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortDirection: req.query.sortDirection as 'asc' | 'desc'
      };
      
      // Get contact requests from service
      const result = await this.contactService.getContactRequests(filters);
      
      // Send response
      this.sendPaginatedResponse(
        res, 
        result.data, 
        result.pagination, 
        'Contact requests retrieved successfully'
      );
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Get contact request by ID (admin only)
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getContactRequestById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get contact request details from service
      const contactRequest = await this.contactService.getContactRequestById(id);
      
      // Send response
      this.sendSuccessResponse(res, contactRequest, 'Contact request retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Update contact request status (admin only)
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async updateContactRequestStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const statusData: UpdateContactRequestStatusDto = req.body;
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      
      // Update status with context
      const contactRequest = await this.contactService.updateContactRequestStatus(id, statusData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(res, contactRequest, 'Contact request status updated successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Add a note to a contact request (admin only)
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async addContactRequestNote(req: Request, res: Response): Promise<void> {
    try {
      const requestId = parseInt(req.params.id, 10);
      const { text }: AddContactRequestNoteDto = req.body;
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name || 'System';
      
      // Create note data
      const noteData: any = {
        requestId,
        userId,
        userName,
        text
      };
      
      // Add note with context
      const note = await this.contactService.addContactRequestNote(noteData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendCreatedResponse(res, note, 'Note added successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }
}