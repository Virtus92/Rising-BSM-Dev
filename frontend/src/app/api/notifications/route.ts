/**
 * API route for notifications
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatValidationError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const filterParams: NotificationFilterParamsDto = {
      userId: request.auth?.userId,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page') as string) : undefined,
      unreadOnly: searchParams.get('unreadOnly') === 'true'
    };
    
    // Get notification service
    const notificationService = serviceFactory.createNotificationService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Query notifications directly from repository to avoid method errors
    const repository = notificationService.getRepository();
    
    // Build query criteria
    const criteria: Record<string, any> = {
      userId: request.auth?.userId
    };
    
    // Add unread filter if specified
    if (filterParams.unreadOnly) {
      criteria.isRead = false;
    }
    
    // Get total count for pagination
    const total = await repository.count(criteria);
    
    // Get notifications with pagination
    const page = filterParams.page || 1;
    const limit = filterParams.limit || 10;
    
    // Find notifications matching criteria
    const notifications = await repository.findByCriteria(criteria, {
      page,
      limit,
      sort: { field: 'createdAt', direction: 'desc' }
    });
    
    // Map to response DTOs
    const notificationDtos = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt instanceof Date ? 
        notification.createdAt.toISOString() : notification.createdAt,
      relatedEntityId: notification.relatedEntityId,
      relatedEntityType: notification.relatedEntityType,
      userId: notification.userId
    }));
    
    // Create result with pagination
    const result = {
      data: notificationDtos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    return formatSuccess(result, 'Notifications retrieved successfully');
  } catch (error) {
    logger.error('Error fetching notifications:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to fetch notifications',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});

/**
 * POST /api/notifications
 * Create a new notification (admin only)
 */
export const POST = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Parse request body
    const data = await request.json();
    
    // Get notification service
    const notificationService = serviceFactory.createNotificationService();
    
    // Context for service calls with role check
    const context = { 
      userId: request.auth?.userId,
      userRole: request.auth?.role
    };
    
    // Check if user has admin role
    if (context.userRole !== 'ADMIN') {
      return formatError('Unauthorized - Admin access required', 403);
    }
    
    // Create notification
    const result = await notificationService.create(data, { context });
    
    return formatSuccess(result, 'Notification created successfully', 201);
  } catch (error) {
    logger.error('Error creating notification:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error as any).validationErrors,
        'Notification validation failed'
      );
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to create notification',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true,
  // Optionally restrict to admin role
  requiresRole: ['ADMIN']
});
