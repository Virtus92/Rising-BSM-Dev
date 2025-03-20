// controllers/project.controller.ts
import { Request, Response } from 'express';
import prisma from '../utils/prisma.utils';
import { formatDateSafely } from '../utils/formatters';
import { getProjektStatusInfo, getTerminStatusInfo } from '../utils/helpers';
import { 
  NotFoundError, 
  ValidationError,
  BadRequestError
} from '../utils/errors';
import { validateInput } from '../utils/validators';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types/authenticated-request';
import config from '../config';
import { ValidationSchema, convertValidationSchema } from '../utils/validation-types';

// Type definitions
interface ProjectData {
  titel: string;
  kunde_id?: string | number | null;
  dienstleistung_id?: string | number | null;
  start_datum: string;
  end_datum?: string | null;
  betrag?: string | number | null;
  beschreibung?: string | null;
  status?: string;
}

interface ProjectFilterOptions {
  status?: string;
  kunde_id?: string | number;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Get all projects with optional filtering
 */
export const getAllProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const { 
    status, 
    kunde_id, 
    search, 
    page = 1, 
    limit = config.DEFAULT_PAGE_SIZE 
  } = req.query as unknown as ProjectFilterOptions;

  // Validate and sanitize pagination parameters
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(config.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config.DEFAULT_PAGE_SIZE));
  const skip = (pageNumber - 1) * pageSize;

  // Build filter conditions
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (kunde_id) {
    where.customerId = Number(kunde_id);
  }
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { Customer: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Execute queries in parallel
  const [projects, totalCount] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        Customer: true,
        Service: true
      },
      orderBy: { startDate: 'desc' },
      take: pageSize,
      skip
    }),
    prisma.project.count({ where })
  ]);

  // Format project data
  interface ProjectRecord {
    id: number;
    title: string;
    customerId: number | null;
    serviceId: number | null;
    startDate: Date | null; // Allow null here
    endDate: Date | null;
    status: string;
    amount: number | null;
    createdAt: Date;
    updatedAt: Date;
    // ...other properties...
  }
  
  const formattedProjects = projects.map((project: any): Record<string, any> => {
    const statusInfo = getProjektStatusInfo(project.status);
    return {
      id: project.id,
      titel: project.title,
      kunde_id: project.customerId,
      kunde_name: project.Customer?.name || 'Kein Kunde zugewiesen',
      dienstleistung: project.Service?.name || 'Keine Dienstleistung',
      start_datum: formatDateSafely(project.startDate || new Date(), 'dd.MM.yyyy'),
      end_datum: formatDateSafely(project.endDate || new Date(), 'dd.MM.yyyy'),
      status: project.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className,
      betrag: project.amount
    };
  });

  // Calculate pagination data
  const totalPages = Math.ceil(totalCount / pageSize);

  // Return data object for rendering or JSON response
  res.status(200).json({
    success: true,
    projects: formattedProjects,
    pagination: {
      current: pageNumber,
      limit: pageSize,
      total: totalPages,
      totalRecords: totalCount
    },
    filters: {
      status,
      kunde_id,
      search
    }
  });
});

/**
 * Get project by ID with related data
 */
export const getProjectById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const projectId = Number(id);
  
  if (isNaN(projectId)) {
    throw new BadRequestError('Invalid project ID');
  }

  // Get project details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      Customer: true,
      Service: true
    }
  });
  
  if (!project) {
    throw new NotFoundError(`Project with ID ${projectId} not found`);
  }
  
  const statusInfo = getProjektStatusInfo(project.status);

  // Get appointments and notes in parallel
  const [appointments, notes] = await Promise.all([
    prisma.appointment.findMany({
      where: { projectId },
      orderBy: { appointmentDate: 'asc' }
    }),
    
    prisma.projectNote.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })
  ]);
  
  // Format project data for response
  interface AppointmentRecord {
    id: number;
    title: string;
    appointmentDate: Date;
    status: string;
  }
  
  interface NoteRecord {
    id: number;
    text: string;
    createdAt: Date;
    userName: string;
  }
  
  const result = {
    project: {
      id: project.id,
      titel: project.title,
      kunde_id: project.customerId,
      kunde_name: project.Customer?.name || 'Kein Kunde zugewiesen',
      dienstleistung_id: project.serviceId,
      dienstleistung: project.Service?.name || 'Nicht zugewiesen',
      start_datum: formatDateSafely(project.startDate, 'dd.MM.yyyy'),
      end_datum: project.endDate ? formatDateSafely(project.endDate, 'dd.MM.yyyy') : 'Nicht festgelegt',
      betrag: project.amount ? Number(project.amount) : null,
      beschreibung: project.description || 'Keine Beschreibung vorhanden',
      status: project.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className
    },
    appointments: appointments.map((appointment: AppointmentRecord) => {
      const appointmentStatus = getTerminStatusInfo(appointment.status);
      return {
        id: appointment.id,
        titel: appointment.title,
        datum: formatDateSafely(appointment.appointmentDate, 'dd.MM.yyyy, HH:mm'),
        statusLabel: appointmentStatus.label,
        statusClass: appointmentStatus.className
      };
    }),
    notes: notes.map((note: NoteRecord) => ({
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
 * Create a new project
 */
export const createProject = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Create validation schema with correct typing
  const validationSchema: ValidationSchema = {
    titel: { type: 'text', required: true, minLength: 2 },
    kunde_id: { type: 'text', required: false },
    dienstleistung_id: { type: 'text', required: false },
    start_datum: { type: 'date', required: true },
    end_datum: { type: 'date', required: false },
    betrag: { type: 'numeric', required: false },
    beschreibung: { type: 'text', required: false },
    status: { type: 'text', required: false }
  };

  // Convert the schema to the base validation schema format
  const baseSchema = convertValidationSchema(validationSchema);

  // Validate with the converted schema
  const { validatedData } = validateInput<ProjectData>(
    req.body, 
    baseSchema,
    { throwOnError: true }
  );
  
  // Insert project into database using Prisma
  const newProject = await prisma.project.create({
    data: {
      title: validatedData.titel,
      customerId: validatedData.kunde_id ? Number(validatedData.kunde_id) : null,
      serviceId: validatedData.dienstleistung_id ? Number(validatedData.dienstleistung_id) : null,
      startDate: new Date(validatedData.start_datum),
      endDate: validatedData.end_datum ? new Date(validatedData.end_datum) : null,
      amount: validatedData.betrag ? Number(validatedData.betrag) : null,
      description: validatedData.beschreibung || null,
      status: validatedData.status || 'neu',
      createdBy: req.user?.id || null
    }
  });
  
  // Log the activity
  if (req.user?.id) {
    await prisma.projectLog.create({
      data: {
        projectId: newProject.id,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'created',
        details: 'Project created'
      }
    });

    // Create notification for customer if assigned
    if (validatedData.kunde_id) {
      await prisma.notification.create({
        data: {
          userId: Number(validatedData.kunde_id),
          type: 'projekt',
          title: 'Neues Projekt erstellt',
          message: `Ein neues Projekt "${validatedData.titel}" wurde angelegt.`,
          referenceId: newProject.id,
          referenceType: 'projekte'
        }
      });
    }
  }

  res.status(201).json({
    success: true,
    projectId: newProject.id,
    message: 'Project created successfully'
  });
});

/**
 * Update an existing project
 */
export const updateProject = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const projectId = Number(id);
  
  if (isNaN(projectId)) {
    throw new BadRequestError('Invalid project ID');
  }

  // Validate input using validator utility
  const validationSchema: ValidationSchema = {
    titel: { type: 'text', required: true, minLength: 2 },
    kunde_id: { type: 'text', required: false },
    dienstleistung_id: { type: 'text', required: false },
    start_datum: { type: 'date', required: true },
    end_datum: { type: 'date', required: false },
    betrag: { type: 'numeric', required: false },
    beschreibung: { type: 'text', required: false },
    status: { type: 'text', required: false }
  };

  const baseSchema = convertValidationSchema(validationSchema);

  const { validatedData } = validateInput<ProjectData>(
    req.body, 
    baseSchema,
    { throwOnError: true }
  );

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new NotFoundError(`Project with ID ${projectId} not found`);
  }
  
  // Update project in database
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      title: validatedData.titel,
      customerId: validatedData.kunde_id ? Number(validatedData.kunde_id) : null,
      serviceId: validatedData.dienstleistung_id ? Number(validatedData.dienstleistung_id) : null,
      startDate: new Date(validatedData.start_datum),
      endDate: validatedData.end_datum ? new Date(validatedData.end_datum) : null,
      amount: validatedData.betrag ? Number(validatedData.betrag) : null,
      description: validatedData.beschreibung || null,
      status: validatedData.status || 'neu',
      updatedAt: new Date()
    }
  });
  
  // Log the activity
  if (req.user?.id) {
    await prisma.projectLog.create({
      data: {
        projectId,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'updated',
        details: 'Project updated'
      }
    });
  }

  res.status(200).json({
    success: true,
    projectId,
    message: 'Project updated successfully'
  });
});

/**
 * Update project status
 */
export const updateProjectStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id, status, note } = req.body;
  const projectId = Number(id);
  
  if (isNaN(projectId)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  // Validation
  if (!status) {
    throw new ValidationError('Status is required', ['Status is required']);
  }
  
  // Check valid status values
  if (!['neu', 'in_bearbeitung', 'abgeschlossen', 'storniert'].includes(status)) {
    throw new ValidationError('Invalid status value', 
      ['Status must be one of: neu, in_bearbeitung, abgeschlossen, storniert']);
  }
  
  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });
  
  if (!project) {
    throw new NotFoundError(`Project with ID ${projectId} not found`);
  }
  
  // Use a transaction for status update and optional note
  await prisma.$transaction(async (tx: any) => {
    // Update status in database
    await tx.project.update({
      where: { id: projectId },
      data: {
        status,
        updatedAt: new Date()
      }
    });
    
    // Add note if provided
    if (note && note.trim() !== '' && req.user?.id) {
      await tx.projectNote.create({
        data: {
          projectId,
          userId: req.user.id,
          userName: req.user.name || 'Unknown',
          text: note
        }
      });
    }
    
    // Log the status change
    if (req.user?.id) {
      await tx.projectLog.create({
        data: {
          projectId,
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
    projectId,
    message: 'Project status updated successfully'
  });
});

/**
 * Add a note to project
 */
export const addProjectNote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const projectId = Number(id);
  const { note } = req.body;
  
  if (isNaN(projectId)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  if (!note || note.trim() === '') {
    throw new ValidationError('Note cannot be empty', ['Note cannot be empty']);
  }
  
  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new NotFoundError(`Project with ID ${projectId} not found`);
  }
  
  // Insert note into database
  await prisma.projectNote.create({
    data: {
      projectId,
      userId: req.user?.id || null,
      userName: req.user?.name || 'Unknown',
      text: note
    }
  });
  
  // Log the note addition
  if (req.user?.id) {
    await prisma.projectLog.create({
      data: {
        projectId,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'note_added',
        details: 'Note added to project'
      }
    });
  }

  res.status(201).json({
    success: true,
    projectId,
    message: 'Note added successfully'
  });
});

/**
 * Export projects data
 */
export const exportProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Since the export service requires updates for Prisma compatibility,
  // we'll return a not implemented response for now
  res.status(501).json({ 
    message: 'Export functionality is being migrated to TypeScript and Prisma' 
  });
});