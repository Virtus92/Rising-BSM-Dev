import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { INotificationService } from '@/domain/services/INotificationService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { CreateNotificationRequest } from '../models/notification-request-models';

/**
 * POST handler for creating a notification
 * @param request - Next.js request object
 * @returns Response with created notification
 */
export const POST = auth(
  async (request: NextRequest, user) => {
    try {
      // User is already authenticated through the auth middleware
      if (!user) {
        return formatResponse.error('Authentication failed', 401);
      }

    // Parse request body
    const data: CreateNotificationRequest = await request.json();

    // Validate required fields
    if (!data.userId || !data.title || !data.message || !data.type) {
      return formatResponse.error('Missing required fields: userId, title, message, and type are required', 400);
    }

    // Get notification service
    const serviceFactory = getServiceFactory();
    const notificationService = serviceFactory.createNotificationService();

    // Create notification
    const notification = await notificationService.create(data, {
      context: {
        userId: user.id
      }
    });

    // Return formatted response
    return formatResponse.success(notification, 'Notification created successfully', 201);
  } catch (error) {
    console.error('Error creating notification:', error);
    return formatResponse.error(
      error instanceof Error ? error.message : 'An error occurred while creating the notification', 
      500
    );
  }
},
// Auth middleware options
{
  requireAuth: true,
  requiredPermission: [SystemPermission.NOTIFICATIONS_VIEW]
});
