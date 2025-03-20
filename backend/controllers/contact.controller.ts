import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.utils';
import NotificationService from '../services/notification.service';
import { validateInput } from '../utils/validators';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Submit contact form
 */
export const submitContact = asyncHandler<Request, Response | void>(async (req: Request, res: Response, next: NextFunction) => {
  // Input validation schema
  const validationSchema = {
    name: {
      type: 'text' as const,
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    email: {
      type: 'email' as const,
    },
    phone: {
      type: 'phone' as const,
      required: false,
    },
    service: {
      type: 'text' as const,
      required: true,
    },
    message: {
      type: 'text' as const,
      required: true,
      minLength: 10,
      maxLength: 1000,
    },
  };

  // Validate input
  const validationResult = validateInput(req.body, validationSchema);

  if (!validationResult.isValid) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors,
    });
  }

  const { name, email, phone = null, service, message } = validationResult.validatedData;

  // Insert contact request into database
  const contactRequest = await prisma.contactRequest.create({
    data: {
      name,
      email,
      phone,
      service,
      message,
      status: 'neu',
      ipAddress: req.ip,
    },
  });

  const requestId = contactRequest.id;

  // Determine notification recipient (admin users)
  const adminUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ['admin', 'manager'],
      },
    },
    select: {
      id: true,
    },
  });

  // Prepare notifications array
  const notifications: any[] = [];

  // Create notifications for admins using array for Promise.all
  if (!adminUsers || adminUsers.length === 0) {
    console.warn('No admin users found to notify.');
  } else {
    interface AdminUser {
      id: number;
    }

    interface ContactNotification {
      userId: number | null;
      type: string;
      title: string;
      message: string;
      referenceId: number;
      referenceType: string;
    }

    adminUsers.forEach((admin: AdminUser) => {
      notifications.push({
        userId: admin.id,
        type: 'anfrage',
        title: 'Neue Kontaktanfrage',
        message: `Neue Anfrage von ${name} über ${service}`,
        referenceId: requestId,
        referenceType: 'kontaktanfragen',
      } as ContactNotification);
    });
  }

  // Add confirmation notification
  notifications.push({
    userId: null, // System notification
    type: 'contact_confirmation',
    title: 'Kontaktanfrage erhalten',
    message: `Wir haben Ihre Anfrage erhalten und werden uns in Kürze bei Ihnen melden`,
    referenceId: requestId,
    referenceType: 'kontaktanfragen',
  });

  // Send all notifications in parallel using Promise.all
  await Promise.all(
    notifications.map((notification) => NotificationService.create(notification))
  );

  // Respond based on request type
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(201).json({
      success: true,
      message: 'Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns bald bei Ihnen.',
      requestId,
    });
  } else {
    // Assuming you have flash messages set up
    // req.flash('success', 'Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns bald bei Ihnen.');
    return res.redirect('/');
  }
});

/**
 * Get contact request by ID
 */
export const getContactRequest = asyncHandler<Request, Response>(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const contactRequest = await prisma.contactRequest.findUnique({
    where: { id: Number(id) },
  });

  if (!contactRequest) {
    return res.status(404).json({ message: 'Contact request not found' });
  }

  return res.json(contactRequest);
});