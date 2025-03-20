import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { prisma } from '../utils/prisma.utils';
import config from '../config';

// Environment configuration
type AuthMode = 'session' | 'jwt' | 'dual';
const AUTH_MODE: AuthMode = (config.AUTH_MODE as AuthMode) || 'dual';

/**
 * Authentication middleware that supports both session and JWT authentication
 * Attaches user object to request if authenticated
 */
export const authenticate = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Strategy 1: Check JWT token in Authorization header
    if (AUTH_MODE === 'jwt' || AUTH_MODE === 'dual') {
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);
      
      if (token) {
        try {
          const payload = verifyToken(token);
          
          // Fetch up-to-date user information from database
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true
            }
          });
          
          if (user && user.status === 'aktiv') {
            (req as AuthenticatedRequest).user = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            };
            return next();
          }
        } catch (error) {
          // If in dual mode, continue to try session authentication
          if (AUTH_MODE !== 'dual') {
            throw error;
          }
        }
      }
    }
    
    // Strategy 2: Check session-based authentication
    if (AUTH_MODE === 'session' || AUTH_MODE === 'dual') {
      if (req.session && req.session.user) {
        // Optional: Verify session user is still valid in database
        (req as AuthenticatedRequest).user = {
          id: req.session.user.id,
          name: req.session.user.name,
          email: req.session.user.email,
          role: req.session.user.role
        };
        return next();
      }
    }
    
    // If no authentication is found
    if (AUTH_MODE === 'dual') {
      throw new UnauthorizedError('Authentication required');
    } else if (AUTH_MODE === 'jwt') {
      throw new UnauthorizedError('Valid JWT token required');
    } else {
      throw new UnauthorizedError('Valid session required');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Utility function that wraps authenticate to handle the callback properly
 */
function handleAuthResult(
  req: Request, 
  res: Response, 
  next: NextFunction, 
  callback: (err?: any) => void
): void {
  try {
    authenticate(req, res, (err?: any) => {
      if (err) {
        callback(err);
        return;
      }
      next();
    });
  } catch (error) {
    callback(error);
  }
}

/**
 * Middleware to check if the user is authenticated
 * If not, redirects to login page or returns 401
 **/
export const isAuthenticated = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  handleAuthResult(req, res, next, (err?: any) => {
    if (err) {
      // For API requests, return 401 Unauthorized
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          redirect: '/login'
        });
      }
      
      // For regular requests, redirect to login page
      return res.redirect('/login');
    }
  });
};

/**
 * Middleware to check if the authenticated user has admin privileges
 **/
export const isAdmin = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  handleAuthResult(req, res, next, (err?: any) => {
    if (err) {
      // Reuse isAuthenticated logic for unauthenticated users
      return isAuthenticated(req, res, next);
    }
    
    const authReq = req as AuthenticatedRequest;
    
    // Check for admin role
    if (authReq.user?.role === 'admin') {
      return next();
    }
    
    // Not an admin - forbidden
    const forbiddenError = new ForbiddenError('Admin privileges required');
    
    // For API requests, return 403 Forbidden
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(403).json({
        success: false,
        message: forbiddenError.message,
        redirect: '/dashboard'
      });
    }
    
    // For regular requests, redirect with flash message
    if (req.flash) {
      req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
    }
    return res.redirect('/dashboard');
  });
};

/**
 * Middleware to check if the authenticated user has manager privileges (manager or admin)
 **/
export const isManager = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  handleAuthResult(req, res, next, (err?: any) => {
    if (err) {
      // Reuse isAuthenticated logic for unauthenticated users
      return isAuthenticated(req, res, next);
    }
    
    const authReq = req as AuthenticatedRequest;
    
    // Check for manager or admin role
    if (authReq.user?.role === 'admin' || authReq.user?.role === 'manager') {
      return next();
    }
    
    // Not a manager - forbidden
    const forbiddenError = new ForbiddenError('Manager privileges required');
    
    // For API requests, return 403 Forbidden
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(403).json({
        success: false,
        message: forbiddenError.message,
        redirect: '/dashboard'
      });
    }
    
    // For regular requests, redirect with flash message
    if (req.flash) {
      req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
    }
    return res.redirect('/dashboard');
  });
};

/**
 * Middleware to check if the authenticated user has employee privileges (or higher)
 **/
export const isEmployee = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  handleAuthResult(req, res, next, (err?: any) => {
    if (err) {
      // Reuse isAuthenticated logic for unauthenticated users
      return isAuthenticated(req, res, next);
    }
    
    const authReq = req as AuthenticatedRequest;
    
    // Check for employee, manager or admin role
    if (['admin', 'manager', 'employee', 'mitarbeiter'].includes(authReq.user?.role || '')) {
      return next();
    }
    
    // Not an employee - forbidden
    const forbiddenError = new ForbiddenError('Employee privileges required');
    
    // For API requests, return 403 Forbidden
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(403).json({
        success: false,
        message: forbiddenError.message,
        redirect: '/dashboard'
      });
    }
    
    // For regular requests, redirect with flash message
    if (req.flash) {
      req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
    }
    return res.redirect('/dashboard');
  });
};

/**
 * Middleware to check if the user is not authenticated
 * Used for login/register pages to prevent authenticated users from accessing them
 **/
export const isNotAuthenticated = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  handleAuthResult(req, res, next, (err?: any) => {
    if (err) {
      // If authentication fails, user is not authenticated
      return next();
    }
    
    // User is authenticated, redirect to dashboard
    return res.redirect('/dashboard');
  });
};