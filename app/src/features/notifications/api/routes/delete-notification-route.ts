import { NextResponse } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getServiceFactory } from '@/core/factories';
import { INotificationService } from '@/domain/services/INotificationService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * DELETE handler for deleting a notification
 * @param request - Next.js request object
 * @param params - URL parameters including notification ID
 * @returns Response with success status
 */
export async function DELETE(
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

    // Check if the user has permission to delete this notification
    const isOwner = existingNotification.userId === authResult.user?.id;
    const hasPermission = await permissionMiddleware.checkPermission(request, [SystemPermission.NOTIFICATIONS_DELETE]);
    
    if (!isOwner && !hasPermission.success) {
      return formatResponse.error('You do not have permission to delete this notification', 403);
    }

    // Delete notification
    const result = await notificationService.delete(id, {
      context: {
        userId: authResult.user?.id
      }
    });

    // Return formatted response
    return formatResponse.success({ success: result, id }, 'Notification deleted successfully');
  } catch (error) {
    return formatResponse.error('An error occurred while deleting the notification', 500);
  }
}
