import { Request, Response } from 'express';
import { IRequestService } from '../interfaces/IRequestService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { BaseController } from '../core/BaseController.js';
import { IRequestController } from '../interfaces/IRequestController.js';
import { 
  CreateRequestDto, 
  UpdateRequestStatusDto, 
  AddRequestNoteDto, 
  RequestFilterParams,
  AssignRequestDto,
  BatchUpdateStatusDto 
} from '../dtos/RequestDtos.js';
import { IUserService } from '../interfaces/IUserService.js';

/**
 * RequestController
 * 
 * Controller for handling contact request-related HTTP requests.
 */
export class RequestController extends BaseController implements IRequestController {
  /**
   * Creates a new RequestController instance
   */
  constructor(
    private readonly requestService: IRequestService,
    private readonly userService: IUserService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(logger, errorHandler);
    
    // Bind methods to preserve 'this' context when used as route handlers
    this.submitRequest = this.submitRequest.bind(this);
    this.getAllRequests = this.getAllRequests.bind(this);
    this.getRequestById = this.getRequestById.bind(this);
    this.updateRequestStatus = this.updateRequestStatus.bind(this);
    this.addRequestNote = this.addRequestNote.bind(this);
    this.assignRequest = this.assignRequest.bind(this);
    this.batchUpdateRequestStatus = this.batchUpdateRequestStatus.bind(this);
    this.exportRequests = this.exportRequests.bind(this);
    
    this.logger.debug('Initialized RequestController');
  }

  /**
   * Submit a new contact request (public endpoint)
   */
  async submitRequest(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateRequestDto = req.body;
      
      // Basic validation
      if (!data.name || !data.email || !data.service || !data.message) {
        throw this.errorHandler.createValidationError('Invalid request data', [
          'Name, email, service, and message are required'
        ]);
      }
      
      // Create contact request with client IP
      const contactRequest = await this.requestService.createRequest(data, {
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
   */
  async getAllRequests(req: Request, res: Response): Promise<void> {
    try {
      // Extract query parameters
      const filters: RequestFilterParams = {
        status: req.query.status as string,
        service: req.query.service as string,
        date: req.query.date as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortDirection: req.query.sortDirection as 'asc' | 'desc'
      };
      
      // Log the request parameters for debugging
      this.logger.debug(`Request filters: ${JSON.stringify(filters)}`, {
        method: req.method,
        path: req.path,
        query: req.query
      });
      
      // Get contact requests from service
      const result = await this.requestService.getRequests(filters);
      
      // Send response
      this.sendPaginatedResponse(
        res, 
        result.data, 
        result.pagination, 
        'Contact requests retrieved successfully',
        result.meta
      );
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Get contact request by ID (admin only)
   */
  async getRequestById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get contact request details from service
      const contactRequest = await this.requestService.getRequestById(id);
      
      // Send response
      this.sendSuccessResponse(res, contactRequest, 'Contact request retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Update contact request status (admin only)
   */
  async updateRequestStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const statusData: UpdateRequestStatusDto = req.body;
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      
      // Update status with context
      const contactRequest = await this.requestService.updateRequestStatus(id, statusData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(res, {
        id: contactRequest.id,
        status: contactRequest.status,
        statusLabel: this.getStatusLabel(contactRequest.status)
      }, 'Request status updated successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Add a note to a contact request (admin only)
   */
  async addRequestNote(req: Request, res: Response): Promise<void> {
    try {
      const requestId = parseInt(req.params.id, 10);
      const { note } = req.body;
      
      if (!note) {
        throw this.errorHandler.createValidationError('Invalid note data', ['Note text is required']);
      }
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name || 'System';
      
      // Create note data
      const noteData: any = {
        requestId,
        userId,
        userName,
        text: note
      };
      
      // Add note with context
      const createdNote = await this.requestService.addRequestNote(noteData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendCreatedResponse(res, {
        id: createdNote.id,
        requestId: createdNote.requestId,
        text: createdNote.text,
        userName: createdNote.userName,
        createdAt: createdNote.createdAt
      }, 'Note added successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Assign a request to a processor (admin only)
   */
  async assignRequest(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const assignData: AssignRequestDto = req.body;
      
      if (!assignData.processorId) {
        throw this.errorHandler.createValidationError('Invalid data', ['Processor ID is required']);
      }
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      
      // Assign request with context
      const contactRequest = await this.requestService.assignRequest(id, assignData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Get processor name from UserService
      let processorName = "Unassigned";
      if (contactRequest.processorId !== null) {
        const processor = await this.userService.getUserDetails(contactRequest.processorId);
        processorName = processor ? processor.fullName || processor.name : "Unknown";
      }
      
      // Send response
      this.sendSuccessResponse(res, {
        id: contactRequest.id,
        processorId: contactRequest.processorId,
        processorName
      }, 'Request assigned successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Batch update request status (admin only)
   */
  async batchUpdateRequestStatus(req: Request, res: Response): Promise<void> {
    try {
      const batchData: BatchUpdateStatusDto = req.body;
      
      if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
        throw this.errorHandler.createValidationError('Invalid data', ['At least one request ID is required']);
      }
      
      if (!batchData.status) {
        throw this.errorHandler.createValidationError('Invalid data', ['Status is required']);
      }
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      
      // Update statuses with context
      const result = await this.requestService.batchUpdateRequestStatus(batchData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(res, {
        success: true,
        count: result.count
      }, `${result.count} requests updated successfully`);
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Export contact requests (admin only)
   */
  async exportRequests(req: Request, res: Response): Promise<void> {
    try {
      const format = (req.query.format as string || 'excel') as 'csv' | 'excel';
      
      // Extract filter parameters
      const filters: RequestFilterParams = {
        status: req.query.status as string,
        service: req.query.service as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string
      };
      
      // Export requests
      const fileBuffer = await this.requestService.exportRequests(format, filters);
      
      // Set appropriate headers based on format
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=contact-requests.csv');
      } else {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=contact-requests.xlsx');
      }
      
      // Send file
      res.send(fileBuffer);
    } catch (error) {
      this.handleError(error, req, res);
    }
  }
  
  /**
   * Helper method to get formatted status label
   */
  private getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'neu': 'Neu',
      'in_bearbeitung': 'In Bearbeitung',
      'beantwortet': 'Beantwortet',
      'geschlossen': 'Geschlossen'
    };
    
    return statusMap[status] || status;
  }
}