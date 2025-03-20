// middleware/dashboard.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.utils';
import notificationService from '../services/notification.service';
import { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Middleware to get new requests count
 * Attaches the count of new contact requests to the request object
 */
export const getNewRequestsCountMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const count = await prisma.contactRequest.count({
      where: { status: 'neu' }
    });
    
    (req as any).newRequestsCount = count;
    next();
  } catch (error) {
    console.error('Error fetching new requests count:', error);
    (req as any).newRequestsCount = 0;
    next();
  }
};

/**
 * Middleware to attach user notifications
 * Retrieves and attaches user notifications to the request object
 */
export const attachNotificationsMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    // Only attach notifications if user is authenticated
    if (authReq.user) {
      const notificationsData = await notificationService.getNotifications(
        authReq.user.id, 
        { limit: 5, unreadOnly: true }
      );
      
      (req as any).notifications = notificationsData.notifications;
      (req as any).unreadNotificationsCount = notificationsData.unreadCount;
    } else {
      (req as any).notifications = [];
      (req as any).unreadNotificationsCount = 0;
    }
    
    next();
  } catch (error) {
    console.error('Error attaching notifications:', error);
    (req as any).notifications = [];
    (req as any).unreadNotificationsCount = 0;
    next();
  }
};

/**
 * Middleware to log user activity
 * Logs route access and potentially other user interactions
 */
export const logUserActivityMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    // Only log for authenticated users
    if (authReq.user) {
      await prisma.userActivity.create({
        data: {
          userId: authReq.user.id,
          activity: 'route_access',
          ipAddress: req.ip || '0.0.0.0',
          // Add additional info if needed
          // route: req.path
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Error logging user activity:', error);
    next();
  }
};

/**
 * Middleware to prepare dashboard context
 * Combines multiple dashboard-related data preparation steps
 */
export const prepareDashboardContextMiddleware = [
  getNewRequestsCountMiddleware,
  attachNotificationsMiddleware,
  logUserActivityMiddleware
];

export default {
  getNewRequestsCountMiddleware,
  attachNotificationsMiddleware,
  logUserActivityMiddleware,
  prepareDashboardContextMiddleware
};