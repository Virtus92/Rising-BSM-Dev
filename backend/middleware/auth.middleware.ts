import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to check if the user is authenticated via JWT
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    // Check for token
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Verify token
    const payload = verifyToken(token);
    
    // Set user in request
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      // For API requests, return 401 Unauthorized
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(401).json({
          success: false,
          message: error.message,
          redirect: '/login'
        });
      }
      
      // For regular requests, redirect to login page
      if (req.flash) {
        req.flash('error', error.message);
      }
      return res.redirect('/login');
    }
    
    next(error);
  }
};

/**
 * Middleware to check if the user has admin role
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // First ensure the user is authenticated
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Check for admin role
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Admin privileges required');
    }
    
    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      // For API requests, return 403 Forbidden
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({
          success: false,
          message: error.message,
          redirect: '/dashboard'
        });
      }
      
      // For regular requests, redirect with flash message
      if (req.flash) {
        req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
      }
      return res.redirect('/dashboard');
    }
    
    next(error);
  }
};

/**
 * Middleware to check if the user has manager role (manager or admin)
 */
export const isManager = (req: Request, res: Response, next: NextFunction) => {
  try {
    // First ensure the user is authenticated
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Check for manager or admin role
    if (!['admin', 'manager'].includes(req.user.role)) {
      throw new ForbiddenError('Manager privileges required');
    }
    
    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      // For API requests, return 403 Forbidden
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({
          success: false,
          message: error.message,
          redirect: '/dashboard'
        });
      }
      
      // For regular requests, redirect with flash message
      if (req.flash) {
        req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
      }
      return res.redirect('/dashboard');
    }
    
    next(error);
  }
};

/**
 * Middleware to check if the user has employee privileges (or higher)
 */
export const isEmployee = (req: Request, res: Response, next: NextFunction) => {
  try {
    // First ensure the user is authenticated
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Check for employee, manager or admin role
    if (!['admin', 'manager', 'employee', 'mitarbeiter'].includes(req.user.role)) {
      throw new ForbiddenError('Employee privileges required');
    }
    
    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      // For API requests, return 403 Forbidden
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({
          success: false,
          message: error.message,
          redirect: '/dashboard'
        });
      }
      
      // For regular requests, redirect with flash message
      if (req.flash) {
        req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
      }
      return res.redirect('/dashboard');
    }
    
    next(error);
  }
};

/**
 * Middleware to check if the user is not authenticated
 * Used for login/register pages to prevent authenticated users from accessing them
 */
export const isNotAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Check for JWT token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      // If token is valid, user is authenticated
      verifyToken(token);
      return res.redirect('/dashboard');
    } catch (error) {
      // If token is invalid, proceed to login page
      next();
      return;
    }
  }
  
  // No token, proceed to login page
  next();
};