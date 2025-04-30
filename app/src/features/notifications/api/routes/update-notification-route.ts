import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getServiceFactory } from '@/core/factories';
import { INotificationService } from '@/domain/services/INotificationService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UpdateNotificationRequest } from '../models/notification-request-models';

/**
 * PUT handler for updating a notification
 * @param request - Next.js request object
 * @param params - URL parameters including notification ID
 * @returns Response with updated notification
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extract ID from params
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return formatResponse.error('Invalid notification ID', 400);
    }

    // Authenticate user
    const authResult = await auth(request);
    if (!authResult.success) {
      return formatResponse.error(authResult.message || 'Authentication required', authResult.status || 401);
    }

    // Get notification service
    const serviceFactory = getServiceFactory();
    const notificationService = serviceFactory.createNotificationService();

    // Get the notification to check ownership
    const existingNotification = await notificationService.getById(id);
    if (!existingNotification) {
      return formatResponse.notFound(`Notification with ID ${id} not found`);
    }

    // Check if the user has permission to update this notification
    const isOwner = existingNotification.userId === authResult.user?.id;
    const hasPermission = await permissionMiddleware.checkPermission(request as NextRequest, [SystemPermission.NOTIFICATIONS_EDIT]);
    
    if (!isOwner && !hasPermission.success) {
      return formatResponse.error('You do not have permission to update this notification', 403);
    }

    // Parse request body
    const data: UpdateNotificationRequest = await request.json();

    // Update notification
    const updatedNotification = await notificationService.update(id, data, {
      context: {
        userId: authResult.user?.id
      }
    });

    // Return formatted response
    return formatResponse.success(updatedNotification, 'Notification updated successfully');
  } catch (error) {
    return formatResponse.error('An error occurred while updating the notification', 500);
  }
}
