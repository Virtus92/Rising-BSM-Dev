import { NextResponse } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getServiceFactory } from '@/core/factories';
import { INotificationService } from '@/domain/services/INotificationService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { CreateNotificationRequest } from '../models/notification-request-models';

/**
 * POST handler for creating a notification
 * @param request - Next.js request object
 * @returns Response with created notification
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const authResult = await auth(request);
    if (!authResult.success) {
    return formatResponse.error(authResult.message || 'Authentication required', authResult.status || 401);
    }

    // Check permissions
    const hasPermission = await permissionMiddleware.checkPermission(request, [SystemPermission.NOTIFICATIONS_CREATE]);
    if (!hasPermission.success) {
    return formatResponse.error('You do not have permission to create notifications', 403);
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
        userId: authResult.user?.id
      }
    });

    // Return formatted response
    return formatResponse.success(notification, 'Notification created successfully', 201);
  } catch (error) {
    return formatResponse.error('An error occurred while creating the notification', 500);
  }
}
