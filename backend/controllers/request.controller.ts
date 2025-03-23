import { Request, Response } from 'express';
import { BadRequestError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../types/authenticated-request.js';
import { ResponseFactory } from '../utils/response.factory.js';
import { RequestService, requestService } from '../services/request.service.js';
import { 
  RequestFilterDTO,
  RequestStatusUpdateDTO,
  RequestNoteCreateDTO
} from '../types/dtos/request.dto.js';

/**
 * Get all requests with optional filtering
 */
export const getAllRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const filters: RequestFilterDTO = {
    status: req.query.status as string,
    service: req.query.service as string,
    date: req.query.date as string,
    search: req.query.search as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined
  };

  // Get requests from service
  const result = await requestService.findAll(filters, {
    page: filters.page,
    limit: filters.limit
  });
  
  // Send paginated response
  ResponseFactory.paginated(
    res,
    result.data,
    result.pagination,
    'Anfragen erfolgreich abgerufen'
  );
});

/**
 * Get request by ID with related data
 */
export const getRequestById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Ungültige Anfrage-ID');
  }

  // Get request with details from service
  const result = await requestService.findByIdWithDetails(id, {
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, result, 'Anfrage erfolgreich abgerufen');
});

/**
 * Update request status
 */
export const updateRequestStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const statusData: RequestStatusUpdateDTO = req.body;
  
  if (isNaN(Number(statusData.id))) {
    throw new BadRequestError('Ungültige Anfrage-ID');
  }
  
  // Update status with user context
  const result = await requestService.updateStatus(Number(statusData.id), statusData.status, statusData.note || null, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined
  });
  
  // Send success response
  ResponseFactory.success(
    res, 
    { 
      requestId: statusData.id,
      status: statusData.status
    }, 
    'Anfrage-Status erfolgreich aktualisiert'
  );
});

/**
 * Add a note to a request
 */
export const addRequestNote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const noteData: RequestNoteCreateDTO = { note: req.body.note };
  
  if (isNaN(id)) {
    throw new BadRequestError('Ungültige Anfrage-ID');
  }
  
  // Add note with user context
  const result = await requestService.addNote(id, noteData.note, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined
  });
  
  // Send success response
  ResponseFactory.created(
    res, 
    {
      requestId: id,
      noteId: result.noteId
    }, 
    'Notiz erfolgreich hinzugefügt'
  );
});

/**
 * Export requests data
 */
export const exportRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Send not implemented response
  ResponseFactory.status(
    res,
    'Exportfunktionalität wird auf TypeScript und Prisma migriert',
    501 // Not Implemented
  );
});