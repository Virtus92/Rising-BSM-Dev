import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../utils/prisma.utils';
import { formatDateSafely } from '../utils/formatters';
import { getAnfrageStatusInfo } from '../utils/helpers';
import { NotFoundError, ValidationError, BadRequestError } from '../utils/errors';
import { validateInput } from '../utils/validators';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types/authenticated-request';
import config from '../config';

// Type definitions
interface RequestFilterOptions {
  status?: string;
  service?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Get all requests with optional filtering
 */
export const getAllRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const { 
    status, 
    service, 
    date, 
    search, 
    page = 1, 
    limit = config.DEFAULT_PAGE_SIZE 
  } = req.query as unknown as RequestFilterOptions;

  // Validate and sanitize pagination parameters
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(config.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config.DEFAULT_PAGE_SIZE));
  const skip = (pageNumber - 1) * pageSize;

  // Build filter conditions
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (service) {
    where.service = service;
  }
  
  if (date) {
    where.createdAt = {
      gte: new Date(`${date}T00:00:00`),
      lt: new Date(`${date}T23:59:59`)
    };
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Execute queries in parallel
  const [requests, totalCount] = await Promise.all([
    prisma.contactRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip
    }),
    prisma.contactRequest.count({ where })
  ]);

  // Format request data with explicit typing
  interface RequestRecord {
    id: number;
    name: string;
    email: string;
    service: string;
    createdAt: Date;
    status: string;
  }
  
  const formattedRequests = requests.map((request: RequestRecord) => {
    const statusInfo = getAnfrageStatusInfo(request.status);
    return {
      id: request.id,
      name: request.name,
      email: request.email,
      serviceLabel: request.service === 'facility' ? 'Facility Management' : 
                   request.service === 'moving' ? 'Umzüge & Transporte' : 
                   request.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
      formattedDate: formatDateSafely(request.createdAt, 'dd.MM.yyyy'),
      status: statusInfo.label,
      statusClass: statusInfo.className
    };
  });

  // Calculate pagination data
  const totalPages = Math.ceil(totalCount / pageSize);

  // Return data object for rendering or JSON response
  res.status(200).json({
    success: true,
    requests: formattedRequests,
    pagination: {
      current: pageNumber,
      limit: pageSize,
      total: totalPages,
      totalRecords: totalCount
    },
    filters: {
      status,
      service,
      date,
      search
    }
  });
});

/**
 * Get request by ID with related data
 */
export const getRequestById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const requestId = Number(id);
  
  if (isNaN(requestId)) {
    throw new BadRequestError('Invalid request ID');
  }

  // Get request details
  const request = await prisma.contactRequest.findUnique({
    where: { id: requestId }
  });
  
  if (!request) {
    throw new NotFoundError(`Request with ID ${requestId} not found`);
  }
  
  const statusInfo = getAnfrageStatusInfo(request.status);

  interface NoteRecord {
    id: number;
    text: string;
    createdAt: Date;
    userName: string;
  }
  
  const notes = await prisma.requestNote.findMany({
    where: { requestId },
    orderBy: { createdAt: 'desc' }
  });
  
  // Format request data for response
  const result = {
    request: {
      // ... existing properties ...
    },
    notes: notes.map((note: NoteRecord) => ({
      id: note.id,
      text: note.text,
      formattedDate: formatDateSafely(note.createdAt, 'dd.MM.yyyy, HH:mm'),
      benutzer: note.userName
    }))
  };
});

/**
 * Update request status
 */
export const updateRequestStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id, status, note } = req.body;
  const requestId = Number(id);
  
  if (isNaN(requestId)) {
    throw new BadRequestError('Invalid request ID');
  }
  
  // Validation
  if (!status) {
    throw new ValidationError('Status is required', ['Status is required']);
  }
  
  // Check valid status values
  if (!['neu', 'in_bearbeitung', 'beantwortet', 'geschlossen'].includes(status)) {
    throw new ValidationError('Invalid status value', 
      ['Status must be one of: neu, in_bearbeitung, beantwortet, geschlossen']);
  }
  
  // Check if request exists
  const request = await prisma.contactRequest.findUnique({
    where: { id: requestId }
  });
  
  if (!request) {
    throw new NotFoundError(`Request with ID ${requestId} not found`);
  }
  
  await prisma.$transaction(async (tx: any) => {
    // Update status in database
    await tx.contactRequest.update({
      where: { id: requestId },
      data: {
        status,
        updatedAt: new Date()
      }
    });
    
    // Add note if provided and user exists
    if (note && note.trim() !== '' && req.user?.id) {
      await tx.requestNote.create({
        data: {
          requestId,
          userId: req.user.id, // Required field
          userName: req.user.name || 'Unknown',
          text: note
        }
      });
    }
    
    // Log the status change
    if (req.user?.id) {
      await tx.requestLog.create({
        data: {
          requestId,
          userId: req.user.id,
          userName: req.user.name || 'Unknown',
          action: 'status_changed',
          details: `Status changed to: ${status}`
        }
      });
    }
  });
});

/**
 * Add a note to request
 */
export const addRequestNote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const requestId = Number(id);
  const { note } = req.body;
  
  if (isNaN(requestId)) {
    throw new BadRequestError('Invalid request ID');
  }
  
  if (!note || note.trim() === '') {
    throw new ValidationError('Note cannot be empty', ['Note cannot be empty']);
  }
  
  // Check if request exists
  const request = await prisma.contactRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    throw new NotFoundError(`Request with ID ${requestId} not found`);
  }
  
  // Insert note into database - only if userId exists
  if (req.user?.id) {
    await prisma.requestNote.create({
      data: {
        requestId,
        userId: req.user.id, // Required field
        userName: req.user?.name || 'Unknown',
        text: note
      }
    });
    
    // Log the note addition
    await prisma.requestLog.create({
      data: {
        requestId,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'note_added',
        details: 'Note added to request'
      }
    });
  } else {
    // Handle case where no user ID is available
    console.warn('Note added without user context');
  }

  res.status(201).json({
    success: true,
    requestId,
    message: 'Note added successfully'
  });
});

/**
 * Export requests data
 */
export const exportRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Since the export service requires updates for Prisma compatibility,
  // we'll return a not implemented response for now
  res.status(501).json({ 
    message: 'Export functionality is being migrated to TypeScript and Prisma' 
  });
});