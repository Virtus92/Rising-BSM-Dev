import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../types/common/types.js';
import { ResponseFactory } from '../utils/response.factory.js';
import { AppointmentService, appointmentService } from '../services/appointment.service.js';
import { 
  AppointmentFilterParams,
  AppointmentCreateDTO,
  AppointmentUpdateDTO,
  AppointmentStatusUpdateDTO,
  AppointmentNoteCreateDTO,
  AppointmentStatus
} from '../types/dtos/appointment.dto.js';

/**
 * Type guard to check if request is authenticated
 */
function isAuthenticated(req: Request): req is AuthenticatedRequest & Request {
  return 'user' in req && req.user !== undefined;
}

/**
 * Get user context from request
 */
function getUserContext(req: Request) {
  if (isAuthenticated(req) && req.user) {
    return {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip || 'unknown'
    };
  }
  return undefined;
}

/**
 * Get all appointments with optional filtering
 */
export const getAllAppointments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const filters: AppointmentFilterParams = {
    status: req.query.status as string,
    date: req.query.date as string,
    search: req.query.search as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined
  };

  // Get appointments from service
  const result = await appointmentService.findAll(filters, {
    page: filters.page,
    limit: filters.limit
  });
  
  // Send paginated response
  ResponseFactory.paginated(
    res,
    result.data,
    result.pagination,
    'Appointments retrieved successfully',
    200,
    { filters }
  );
});

/**
 * Get appointment by ID with related data
 */
export const getAppointmentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid appointment ID');
  }

  // Get appointment with details from service
  const result = await appointmentService.findByIdWithDetails(id, {
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, result, 'Appointment retrieved successfully');
});

/**
 * Create a new appointment
 */
export const createAppointment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const body = req.body as any;
  
  // Extract create DTO from request body
  const appointmentData: AppointmentCreateDTO = {
    title: body?.title || '',
    customerId: body?.customerId,
    projectId: body?.projectId,
    appointmentDate: body?.appointmentDate || '',
    appointmentTime: body?.appointmentTime || '',
    duration: body?.duration,
    location: body?.location,
    description: body?.description,
    status: body?.status
  };
  
  // Create appointment with user context
  const result = await appointmentService.create(appointmentData, {
    userContext: getUserContext(req)
  });
  
  // Send created response
  ResponseFactory.created(res, result, 'Appointment created successfully');
});

/**
 * Update an existing appointment
 */
export const updateAppointment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const body = req.body as any;
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid appointment ID');
  }
  
  // Extract update DTO from request body
  const appointmentData: AppointmentUpdateDTO = {
    title: body?.title,
    customerId: body?.customerId,
    projectId: body?.projectId,
    appointmentDate: body?.appointmentDate,
    appointmentTime: body?.appointmentTime,
    duration: body?.duration,
    location: body?.location,
    description: body?.description,
    status: body?.status
  };
  
  // Update appointment with user context
  const result = await appointmentService.update(id, appointmentData, {
    userContext: getUserContext(req),
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, result, 'Appointment updated successfully');
});

/**
 * Delete an existing appointment
 */
export const deleteAppointment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid appointment ID');
  }

  // Delete appointment with user context
  const result = await appointmentService.delete(id, {
    userContext: getUserContext(req),
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, result, 'Appointment deleted successfully');
});

/**
 * Update appointment status
 */
export const updateAppointmentStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const body = req.body as any;
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid appointment ID');
  }
  
  const statusData: Omit<AppointmentStatusUpdateDTO, 'id'> = {
    status: body?.status || '',
    note: body?.note
  };
  
  // Update status with user context
  const result = await appointmentService.updateStatus(id, statusData.status, statusData.note || null, {
    userContext: getUserContext(req)
  });
  
  // Send success response
  ResponseFactory.success(res, result, 'Appointment status updated successfully');
});

/**
 * Add a note to appointment
 */
export const addAppointmentNote = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const body = req.body as any;
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid appointment ID');
  }
  
  const noteData: AppointmentNoteCreateDTO = {
    appointmentId: id,
    text: body?.text || ''
  };
  
  // Add note with user context
  const result = await appointmentService.addNote(id, noteData.text, {
    userContext: getUserContext(req)
  });
  
  // Send success response
  ResponseFactory.success(res, result, 'Note added successfully', 201);
});

/**
 * Export appointments to CSV
 */
export const exportAppointments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const filters: AppointmentFilterParams = {
    status: req.query.status as string,
    date: req.query.date as string,
    search: req.query.search as string,
  };

  // Get appointments from service
  const result = await appointmentService.findAll(filters);

  // Convert appointments to CSV
  const csv = appointmentService.convertToCSV(result.data);

  // Set response headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="appointments.csv"');

  // Send CSV data
  res.status(200).send(csv);
});