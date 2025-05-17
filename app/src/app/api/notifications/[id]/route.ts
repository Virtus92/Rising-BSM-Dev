import { NextRequest, NextResponse } from 'next/server';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { authMiddleware } from '@/features/auth/api/middleware';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';

/**
 * GET /api/notifications/[id]
 * Get specific notification by id
 */
export const GET = routeHandler(async (req: NextRequest) => {
  try {
    // Extract ID from URL path segments
    const urlParts = req.nextUrl.pathname.split('/');
    const idStr = urlParts[urlParts.length - 1]; // Last segment is the [id] part
    const id = parseInt(idStr);
    
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
    console.error('Error fetching notification:', error as Error);
    return formatResponse.error('Error fetching notification', 500);
  }
}, {
  requiresAuth: true
});

export const DELETE = routeHandler(async (req: NextRequest) => {
  try {
    // Extract ID from URL path segments
    const urlParts = req.nextUrl.pathname.split('/');
    const idStr = urlParts[urlParts.length - 1]; // Last segment is the [id] part
    const id = parseInt(idStr);
    
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
    console.error('Error deleting notification:', error as Error);
    return formatResponse.error('Error deleting notification', 500);
  }
}, {
  requiresAuth: true
});
