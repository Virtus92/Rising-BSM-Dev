// controllers/appointment.controller.ts
import { Request, Response } from 'express';
import prisma from '../utils/prisma.utils';
import { formatDateSafely } from '../utils/formatters';
import { getTerminStatusInfo } from '../utils/helpers';
import { 
  NotFoundError, 
  ValidationError,
  BadRequestError
} from '../utils/errors';
import { validateInput, validateDate, validateTimeFormat } from '../utils/validators';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types/authenticated-request';
import config from '../config';

// Type definitions
interface AppointmentData {
  titel: string;
  kunde_id?: string | number | null;
  projekt_id?: string | number | null;
  termin_datum: string;
  termin_zeit: string;
  dauer?: string | number;
  ort?: string | null;
  beschreibung?: string | null;
  status?: string;
}

interface AppointmentFilterOptions {
  status?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Define validation schema type
interface ValidationRule {
  type: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Define types for database records
interface AppointmentRecord {
  id: number;
  title: string;
  customerId: number | null;
  projectId: number | null;
  appointmentDate: Date;
  duration: number;
  location: string | null;
  description: string | null;
  status: string;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  Customer?: {
    id: number;
    name: string;
    [key: string]: any;
  } | null;
  Project?: {
    id: number;
    title: string;
    [key: string]: any;
  } | null;
}

interface AppointmentNote {
  id: number;
  appointmentId: number;
  userId: number | null;
  userName: string;
  text: string;
  createdAt: Date;
}

/**
 * Get all appointments with optional filtering
 */
export const getAllAppointments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const { 
    status, 
    date, 
    search, 
    page = 1, 
    limit = config.DEFAULT_PAGE_SIZE 
  } = req.query as unknown as AppointmentFilterOptions;

  // Validate and sanitize pagination parameters
  const pageNumber: number = Math.max(1, Number(page) || 1);
  const pageSize: number = Math.min(config.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config.DEFAULT_PAGE_SIZE));
  const skip: number = (pageNumber - 1) * pageSize;

  // Build filter conditions
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (date) {
    where.appointmentDate = {
      gte: new Date(`${date}T00:00:00`),
      lt: new Date(`${date}T23:59:59`)
    };
  }
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { Customer: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Execute queries in parallel
  const [appointments, totalCount] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        Customer: true,
        Project: true
      },
      orderBy: { appointmentDate: 'asc' },
      take: pageSize,
      skip
    }),
    prisma.appointment.count({ where })
  ]);

  // Format appointment data
  const formattedAppointments = appointments.map((appointment: AppointmentRecord): Record<string, any> => {
    const statusInfo = getTerminStatusInfo(appointment.status);
    return {
      id: appointment.id,
      titel: appointment.title,
      kunde_id: appointment.customerId,
      kunde_name: appointment.Customer?.name || 'Kein Kunde zugewiesen',
      projekt_id: appointment.projectId,
      projekt_titel: appointment.Project?.title || 'Kein Projekt zugewiesen',
      termin_datum: appointment.appointmentDate,
      dateFormatted: formatDateSafely(appointment.appointmentDate, 'dd.MM.yyyy'),
      timeFormatted: formatDateSafely(appointment.appointmentDate, 'HH:mm'),
      dauer: appointment.duration || 60,
      ort: appointment.location || 'Nicht angegeben',
      status: appointment.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className
    };
  });

  // Calculate pagination data
  const totalPages: number = Math.ceil(totalCount / pageSize);

  // Return data object for rendering or JSON response
  res.status(200).json({
    success: true,
    appointments: formattedAppointments,
    pagination: {
      current: pageNumber,
      limit: pageSize,
      total: totalPages,
      totalRecords: totalCount
    },
    filters: {
      status,
      date,
      search
    }
  });
});

/**
 * Get appointment by ID with related data
 */
export const getAppointmentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id }: { id: string } = req.params;
  const appointmentId: number = Number(id);
  
  if (isNaN(appointmentId)) {
    throw new BadRequestError('Invalid appointment ID');
  }

  // Get appointment details
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      Customer: true,
      Project: true
    }
  });
  
  if (!appointment) {
    throw new NotFoundError(`Appointment with ID ${appointmentId} not found`);
  }
  
  const statusInfo = getTerminStatusInfo(appointment.status);

  // Get notes for this appointment
  const notes = await prisma.appointmentNote.findMany({
    where: { appointmentId },
    orderBy: { createdAt: 'desc' }
  });
  
  // Format appointment data for response
  const result = {
    appointment: {
      id: appointment.id,
      titel: appointment.title,
      kunde_id: appointment.customerId,
      kunde_name: appointment.Customer?.name || 'Kein Kunde zugewiesen',
      projekt_id: appointment.projectId,
      projekt_titel: appointment.Project?.title || 'Kein Projekt zugewiesen',
      termin_datum: appointment.appointmentDate,
      dateFormatted: formatDateSafely(appointment.appointmentDate, 'dd.MM.yyyy'),
      timeFormatted: formatDateSafely(appointment.appointmentDate, 'HH:mm'),
      dauer: appointment.duration || 60,
      ort: appointment.location || 'Nicht angegeben',
      beschreibung: appointment.description || 'Keine Beschreibung vorhanden',
      status: appointment.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className
    },
    notes: notes.map((note: AppointmentNote): Record<string, any> => ({
      id: note.id,
      text: note.text,
      formattedDate: formatDateSafely(note.createdAt, 'dd.MM.yyyy, HH:mm'),
      benutzer: note.userName
    }))
  };
  
  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * Create a new appointment
 */
export const createAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { 
    titel, 
    kunde_id, 
    projekt_id,
    termin_datum, 
    termin_zeit, 
    dauer, 
    ort, 
    beschreibung, 
    status 
  }: AppointmentData = req.body;

  // Validate inputs
  const dateValidation = validateDate(termin_datum, { required: true });
  const timeValidation = validateTimeFormat(termin_zeit, { required: true });
  
  // Validation
  if (!titel || !termin_datum || !termin_zeit || !dateValidation.isValid || !timeValidation.isValid) {
    const errorMessages: string[] = [];
    if (!titel) errorMessages.push('Title is required');
    if (!termin_datum) errorMessages.push('Date is required');
    if (!termin_zeit) errorMessages.push('Time is required');
    if (termin_datum && !dateValidation.isValid) errorMessages.push(dateValidation.errors.join(', '));
    if (termin_zeit && !timeValidation.isValid) errorMessages.push(timeValidation.errors.join(', '));
    
    throw new ValidationError(`Validation failed: ${errorMessages.join('; ')}`, errorMessages);
  }
  
  // Combine date and time
  const appointmentDate: Date = new Date(`${termin_datum}T${termin_zeit}`);
  
  // Insert appointment into database
  const newAppointment = await prisma.appointment.create({
    data: {
      title: titel,
      customerId: kunde_id ? Number(kunde_id) : null,
      projectId: projekt_id ? Number(projekt_id) : null,
      appointmentDate: appointmentDate,
      duration: dauer ? Number(dauer) : 60,
      location: ort || null,
      description: beschreibung || null,
      status: status || 'geplant',
      createdBy: req.user?.id || null
    }
  });
  
  // Log activity
  if (req.user?.id) {
    await prisma.appointmentLog.create({
      data: {
        appointmentId: newAppointment.id,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'created',
        details: 'Appointment created'
      }
    });
  }

  res.status(201).json({
    success: true,
    appointmentId: newAppointment.id,
    message: 'Appointment created successfully'
  });
});

/**
 * Update an existing appointment
 */
export const updateAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id }: { id: string } = req.params;
  const appointmentId: number = Number(id);
  
  if (isNaN(appointmentId)) {
    throw new BadRequestError('Invalid appointment ID');
  }
  
  const { 
    titel, 
    kunde_id, 
    projekt_id,
    termin_datum, 
    termin_zeit, 
    dauer, 
    ort, 
    beschreibung, 
    status
  }: AppointmentData = req.body;
  
  // Validation
  if (!titel || !termin_datum || !termin_zeit) {
    throw new ValidationError('Title, date and time are required fields');
  }

  // Check if appointment exists
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  });

  if (!appointment) {
    throw new NotFoundError(`Appointment with ID ${appointmentId} not found`);
  }
  
  // Combine date and time
  const appointmentDate = new Date(`${termin_datum}T${termin_zeit}`);
  
  // Update appointment in database
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      title: titel,
      customerId: kunde_id ? Number(kunde_id) : null,
      projectId: projekt_id ? Number(projekt_id) : null,
      appointmentDate: appointmentDate,
      duration: dauer ? Number(dauer) : 60,
      location: ort || null,
      description: beschreibung || null,
      status: status || 'geplant',
      updatedAt: new Date()
    }
  });
  
  // Log activity
  if (req.user?.id) {
    await prisma.appointmentLog.create({
      data: {
        appointmentId,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'updated',
        details: 'Appointment updated'
      }
    });
  }

  res.status(200).json({
    success: true,
    appointmentId,
    message: 'Appointment updated successfully'
  });
});

/**
 * Delete an existing appointment
 */
export const deleteAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const appointmentId = Number(id);
  
  if (isNaN(appointmentId)) {
    throw new BadRequestError('Invalid appointment ID');
  }

  // Check if appointment exists
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  });

  if (!appointment) {
    throw new NotFoundError(`Appointment with ID ${appointmentId} not found`);
  }

  // Delete appointment from database
  await prisma.appointment.delete({
    where: { id: appointmentId }
  });

  // Log activity
  if (req.user?.id) {
    await prisma.appointmentLog.create({
      data: {
        appointmentId,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'deleted',
        details: 'Appointment deleted'
      }
    });
  }

  res.status(200).json({
    success: true,
    appointmentId,
    message: 'Appointment deleted successfully'
  });
});

/**
 * Update appointment status
 */
export const updateAppointmentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id, status, note } = req.body;
  const appointmentId = Number(id);
  
  if (isNaN(appointmentId)) {
    throw new BadRequestError('Invalid appointment ID');
  }
  
  // Validation
  if (!status) {
    throw new ValidationError('Status is required', ['Status is required']);
  }
  
  // Check valid status values
  if (!['geplant', 'bestaetigt', 'abgeschlossen', 'storniert'].includes(status)) {
    throw new ValidationError('Invalid status value', 
      ['Status must be one of: geplant, bestaetigt, abgeschlossen, storniert']);
  }
  
  // Check if appointment exists
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  });
  
  if (!appointment) {
    throw new NotFoundError(`Appointment with ID ${appointmentId} not found`);
  }
  
  // Use a transaction for status update and optional note
  await prisma.$transaction(async (tx) => {
    // Update status in database
    await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        updatedAt: new Date()
      }
    });
    
    // Add note if provided
    if (note && note.trim() !== '' && req.user?.id) {
      await tx.appointmentNote.create({
        data: {
          appointmentId,
          userId: req.user.id,
          userName: req.user.name || 'Unknown',
          text: note
        }
      });
    }
    
    // Log the status change
    if (req.user?.id) {
      await tx.appointmentLog.create({
        data: {
          appointmentId,
          userId: req.user.id,
          userName: req.user.name || 'Unknown',
          action: 'status_changed',
          details: `Status changed to: ${status}`
        }
      });
    }
  });

  res.status(200).json({
    success: true,
    appointmentId,
    message: 'Appointment status updated successfully'
  });
});

/**
 * Add a note to appointment
 */
export const addAppointmentNote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const appointmentId = Number(id);
  const { note } = req.body;
  
  if (isNaN(appointmentId)) {
    throw new BadRequestError('Invalid appointment ID');
  }
  
  if (!note || note.trim() === '') {
    throw new ValidationError('Note cannot be empty', ['Note cannot be empty']);
  }
  
  // Check if appointment exists
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  });

  if (!appointment) {
    throw new NotFoundError(`Appointment with ID ${appointmentId} not found`);
  }
  
  // Insert note into database
  await prisma.appointmentNote.create({
    data: {
      appointmentId,
      userId: req.user?.id || null,
      userName: req.user?.name || 'Unknown',
      text: note
    }
  });
  
  // Log the note addition
  if (req.user?.id) {
    await prisma.appointmentLog.create({
      data: {
        appointmentId,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'note_added',
        details: 'Note added to appointment'
      }
    });
  }

  res.status(201).json({
    success: true,
    appointmentId,
    message: 'Note added successfully'
  });
});