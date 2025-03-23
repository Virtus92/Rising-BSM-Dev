import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ResponseFactory } from '../utils/response.factory';
import { RequestService, requestService } from '../services/request.service';
import { NotificationService, notificationService } from '../services/notification.service';
import { ContactRequestCreateDTO } from '../types/dtos/request.dto';

/**
 * Submit contact form
 */
export const submitContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract create DTO from request body
  const contactData: ContactRequestCreateDTO = req.body;
  
  // Create contact request through service
  const result = await requestService.create(contactData, {
    ipAddress: req.ip
  });

  // Create notifications for admins
  await createNotificationsForAdmins(result.id, contactData.name, contactData.service);

  // Respond based on request type
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    ResponseFactory.created(
      res,
      { requestId: result.id },
      'Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns bald bei Ihnen.'
    );
  } else {
    // For non-AJAX requests, redirect to home page
    res.redirect('/');
  }
});

/**
 * Get contact request by ID
 */
export const getContactRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  // Get contact request through service
  const result = await requestService.findById(id, {
    throwIfNotFound: true
  });

  ResponseFactory.success(res, result);
});

/**
 * Create notifications for admin users
 */
async function createNotificationsForAdmins(requestId: number, name: string, service: string): Promise<void> {
  // Find admin users
  const adminUsers = await requestService.getAdminUsers();

  // Create notifications for each admin
  const notifications = adminUsers.map(admin => ({
    userId: admin.id,
    type: 'anfrage',
    title: 'Neue Kontaktanfrage',
    message: `Neue Anfrage von ${name} über ${service}`,
    referenceId: requestId,
    referenceType: 'kontaktanfragen'
  }));

  // Add confirmation notification
  notifications.push({
    userId: null,
    type: 'contact_confirmation',
    title: 'Kontaktanfrage erhalten',
    message: 'Wir haben Ihre Anfrage erhalten und werden uns in Kürze bei Ihnen melden',
    referenceId: requestId,
    referenceType: 'kontaktanfragen'
  });

  // Create all notifications
  await Promise.all(notifications.map(notification => 
    notificationService.create(notification)
  ));
}