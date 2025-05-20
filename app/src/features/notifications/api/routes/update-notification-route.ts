import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';
import { withPermission } from '@/app/api/middleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
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
) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      // Extract ID from params
      const id = parseInt(params.id, 10);
      if (isNaN(id)) {
        return formatResponse.error('Invalid notification ID', 400);
      }

      // Get notification service
      const serviceFactory = getServiceFactory();
      const notificationService = serviceFactory.createNotificationService();

      // Get the notification to check ownership
      const existingNotification = await notificationService.getById(id);
      if (!existingNotification) {
        return formatResponse.notFound(`Notification with ID ${id} not found`);
      }

      // Check if the user is the owner
      const isOwner = existingNotification.userId === user.id;
      
      // If not owner, check permissions
      if (!isOwner) {
        // Create a handler function that we'll use with withPermission
        const permissionHandler = async (req: NextRequest, user: any) => {
          // Parse request body
          const data: UpdateNotificationRequest = await req.json();

          // Update notification
          const updatedNotification = await notificationService.update(id, data, {
            context: {
              userId: user.id
            }
          });

          // Return formatted response
          return formatResponse.success(updatedNotification, 'Notification updated successfully');
        };
        
        // Create the permission-wrapped handler and execute it
        const permissionHandlerWithCheck = await withPermission(
          permissionHandler,
          SystemPermission.NOTIFICATIONS_VIEW
        );
        return await permissionHandlerWithCheck(req);
      }
      
      // If owner, continue with update
      // Parse request body
      const data: UpdateNotificationRequest = await req.json();

      // Update notification
      const updatedNotification = await notificationService.update(id, data, {
        context: {
          userId: user.id
        }
      });

      // Return formatted response
      return formatResponse.success(updatedNotification, 'Notification updated successfully');
    } catch (error) {
      return formatResponse.error(
        error instanceof Error ? error.message : 'An error occurred while updating the notification', 
        500
      );
    }
  })(request);
}
