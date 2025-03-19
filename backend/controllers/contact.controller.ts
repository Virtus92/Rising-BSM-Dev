import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma.utils';
import NotificationService from '../services/notification.service';
import { validateInput } from '../utils/validators';

/**
 * Submit contact form
 */
export const submitContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Input validation schema
    const validationSchema = {
      name: {
        type: 'text',
        required: true,
        minLength: 2,
        maxLength: 100,
      },
      email: {
        type: 'email',
      },
      phone: {
        type: 'phone',
        required: false,
      },
      service: {
        type: 'text',
        required: true,
      },
      message: {
        type: 'text',
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
      adminUsers.forEach((admin) => {
        notifications.push({
          userId: admin.id,
          type: 'anfrage',
          title: 'Neue Kontaktanfrage',
          message: `Neue Anfrage von ${name} über ${service}`,
          referenceId: requestId,
          referenceType: 'kontaktanfragen',
        });
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
    if (req.xhr || req.headers.accept.includes('application/json')) {
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
  } catch (error: any) {
    console.error('Contact form submission error:', error);

    // Handle specific error types
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Eine ähnliche Anfrage wurde kürzlich bereits übermittelt.',
      });
    }

    // Generic error handling
    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      });
    } else {
      // Assuming you have flash messages set up
      // req.flash('error', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      return res.redirect('/');
    }
  }
};

/**
 * Get contact request by ID
 */
export const getContactRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id: Number(id) },
    });

    if (!contactRequest) {
      return res.status(404).json({ message: 'Contact request not found' });
    }

    return res.json(contactRequest);
  } catch (error) {
    next(error);
  }
};
