import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { AuthenticatedRequest } from '../types/authenticated-request.js';
import prisma from '../utils/prisma.utils.js';

/**
 * Authentication middleware that validates JWT tokens
 * Always verifies user in database and attaches user object to request if authenticated
 */
export const authenticate = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }
    
    try {
      const payload = verifyToken(token);
      
      // Always verify user in database
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

      if (!user || user.status !== 'aktiv') {
        throw new UnauthorizedError('User inactive or not found');
      }
      
      (req as AuthenticatedRequest).user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      
      next();
    } catch (error) {
      throw error;
    }
  } catch (error) {
    next(error);
  }
};
