import { Request, Response } from 'express';
import { BadRequestError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../types/authenticated-request.js';
import { ResponseFactory } from '../utils/response.factory.js';
import { AppointmentService, appointmentService } from '../services/appointment.service.js';
import { 
  AppointmentFilterDTO,
  AppointmentCreateDTO,
  AppointmentUpdateDTO,
  AppointmentStatusUpdateDTO,
  AppointmentNoteCreateDTO
} from '../types/dtos/appointment.dto.js';

/**
 * Get all appointments with optional filtering
 */
export const getAllAppointments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const filters: AppointmentFilterDTO = {
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
export const createAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Extract create DTO from request body
  const appointmentData: AppointmentCreateDTO = req.body;
  
  // Create appointment with user context
  const result = await appointmentService.create(appointmentData, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined
  });
  
  // Send created response
  ResponseFactory.created(res, result, 'Appointment created successfully');
});

/**
 * Update an existing appointment
 */
export const updateAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid appointment ID');
  }
  
  // Extract update DTO from request body
  const appointmentData: AppointmentUpdateDTO = req.body;
  
  // Update appointment with user context
  const result = await appointmentService.update(id, appointmentData, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined,
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, result, 'Appointment updated successfully');
});

/**
 * Delete an existing appointment
 */
export const deleteAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid appointment ID');
  }

  // Delete appointment with user context
  const result = await appointmentService.delete(id, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined,
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, result, 'Appointment deleted successfully');
});

/**
 * Update appointment status
 */
export const updateAppointmentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id, status, note }: AppointmentStatusUpdateDTO = req.body;
  
  if (isNaN(Number(id))) {
    throw new BadRequestError('Invalid appointment ID');
  }
  
  // Update status with user context
  const result = await appointmentService.updateStatus(Number(id), status, note || null, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined
  });
  
  // Send success response
  ResponseFactory.success(res, result, 'Appointment status updated successfully');
});

/**
 * Add a note to appointment
 */
export const addAppointmentNote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const noteData: AppointmentNoteCreateDTO = { note: req.body.note };
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid appointment ID');
  }
  
  // Add note with user context
  const result = await appointmentService.addNote(id, noteData.note, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined
  });
  
  // Send success response
  ResponseFactory.success(res, result, 'Note added successfully', 201);
});