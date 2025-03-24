/**
 * Contact Controller
 * 
 * Handles contact form submissions and related operations
 */
import { Request, Response } from 'express';
import { BadRequestError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ResponseFactory } from '../utils/response.factory.js';
import { AuthenticatedRequest } from '../types/common/types.js';
import { RequestService } from '../services/request.service.js';
import { NotificationService, notificationService } from '../services/notification.service.js';
import { ContactRequestCreateDTO } from '../types/dtos/request.dto.js';
import { prisma } from '../utils/prisma.utils.js';

// Erstelle eine neue Instanz des RequestService
const requestService = new RequestService();

/**
 * Submit contact form
 * Handles the initial contact request submission from public-facing forms
 */
export const submitContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract contact data from request body
  const contactData: ContactRequestCreateDTO = req.body;
  
  // Basic validation
  if (!contactData.name || !contactData.email || !contactData.message || !contactData.service) {
    throw new BadRequestError('All required fields must be filled out');
  }
  
  // Create contact request with IP address
  const result = await requestService.create(contactData, {
    userContext: {
      userId: -1,
      userName: 'System',
      userRole: 'system',
      ipAddress: req.ip
    }
  });

  // Create notifications for admin users
  await createNotificationsForNewRequest(result.id, contactData.name, contactData.service);

  // Send appropriate response based on request type
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    // For AJAX requests, return JSON
    ResponseFactory.created(
      res,
      { requestId: result.id },
      'Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns in Kürze bei Ihnen.'
    );
  } else {
    // For regular form submissions, redirect
    res.redirect('/?success=true');
  }
});

/**
 * Allows authenticated users to view a specific contact request
 */
export const getContactRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid request ID');
  }

  // Get contact request with details
  const result = await requestService.findByIdWithDetails(id, {
    throwIfNotFound: true
  });

  ResponseFactory.success(res, result, 'Contact request retrieved successfully');
});

/**
 * Create notifications for administrators about new contact requests
 */
async function createNotificationsForNewRequest(
  requestId: number, 
  name: string, 
  service: string
): Promise<void> {
  try {
    // Find admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'admin',
        status: 'aktiv'
      },
      select: {
        id: true
      }
    });

    // Create notifications for all admin users
    const promises = adminUsers.map(admin => 
      notificationService.create({
        userId: admin.id,
        type: 'anfrage',
        title: 'Neue Kontaktanfrage',
        message: `Neue Anfrage von ${name} zum Thema ${service}`,
        referenceId: requestId,
        referenceType: 'anfrage'
      })
    );

    // Wait for all notifications to be created
    await Promise.all(promises);
  } catch (error) {
    console.error('Error creating notifications:', error);
    // We don't want to fail the contact submission if notifications fail
    // Just log the error and continue
  }
}