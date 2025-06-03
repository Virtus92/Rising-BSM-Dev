import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { UpdateNotificationRequest } from '../models/notification-request-models';

/**
 * PUT handler for updating a notification
 * @param request - Next.js request object
 * @param params - URL parameters including notification ID
 * @returns Response with updated notification
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('Notification update attempted without authentication');
      return NextResponse.json(
        formatResponse.error('Authentication required', 401),
        { status: 401 }
      );
    }

    // Extract ID from params
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        formatResponse.error('Invalid notification ID', 400),
        { status: 400 }
      );
    }

    // Get notification service
    const notificationService = serviceFactory.createNotificationService();

    // Get the notification to check ownership
    const existingNotification = await notificationService.getById(id);
    if (!existingNotification) {
      return NextResponse.json(
        formatResponse.error(`Notification with ID ${id} not found`, 404),
        { status: 404 }
      );
    }

    // Check if the user is the owner
    const isOwner = existingNotification.userId === request.auth.userId;
    
    // If not owner, check permissions
    if (!isOwner && !await permissionMiddleware.hasPermission(
      request.auth.userId, 
      SystemPermission.NOTIFICATIONS_VIEW
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission ${SystemPermission.NOTIFICATIONS_VIEW}`);
      return NextResponse.json(
        formatResponse.error('You don\'t have permission to update this notification', 403),
        { status: 403 }
      );
    }
      
    // Parse request body
    const data: UpdateNotificationRequest = await request.json();

    // Update notification
    const updatedNotification = await notificationService.update(id, data, {
      context: {
        userId: request.auth.userId
      }
    });

    // Return formatted response
    return NextResponse.json(
      formatResponse.success(updatedNotification, 'Notification updated successfully'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error updating notification:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      notificationId: params.id
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'An error occurred while updating the notification',
        500
      ),
      { status: 500 }
    );
  }
}
