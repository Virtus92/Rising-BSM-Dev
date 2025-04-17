/**
 * API route for specific notification operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { authMiddleware } from '../../auth/middleware/authMiddleware';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';

/**
 * GET /api/notifications/[id]
 * Get specific notification by id
 */
export const GET = apiRouteHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return formatResponse.error('Invalid notification ID', 400);
    }

    const serviceFactory = getServiceFactory();
    const notificationService = serviceFactory.createNotificationService();
    const notification = await notificationService.getById(id);

    if (!notification) {
      return formatResponse.error('Notification not found', 404);
    }

    // Check if notification belongs to the current user
    if (notification.userId !== req.auth?.userId && req.auth?.role !== 'ADMIN') {
      return formatResponse.error('Access denied', 403);
    }

    return formatResponse.success(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    return formatResponse.error('Error fetching notification', 500);
  }
}, {
  requiresAuth: true
});

export const DELETE = apiRouteHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return formatResponse.error('Invalid notification ID', 400);
    }

    const serviceFactory = getServiceFactory();
    const notificationService = serviceFactory.createNotificationService();
    
    // Check if notification belongs to the current user
    const notification = await notificationService.getById(id);
    if (!notification) {
      return formatResponse.error('Notification not found', 404);
    }
    
    if (notification.userId !== req.auth?.userId && req.auth?.role !== 'ADMIN') {
      return formatResponse.error('Access denied', 403);
    }

    await notificationService.delete(id);

    return formatResponse.success({ success: true }, 'Notification deleted successfully');
  } catch (error) {
    console.error('Error deleting notification:', error);
    return formatResponse.error('Error deleting notification', 500);
  }
}, {
  requiresAuth: true
});
