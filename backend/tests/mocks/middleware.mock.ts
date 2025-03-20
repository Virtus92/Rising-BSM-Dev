import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

export const mockMiddleware = {
  csrf: (req: Request, res: Response, next: NextFunction) => {
    req.csrfToken = () => 'mock-csrf-token';
    next();
  },
  
  flash: (req: Request, res: Response, next: NextFunction) => {
    req.flash = jest.fn().mockImplementation((...args: any[]) => {
      if (args.length === 0) {
        return {}; // Return empty object for no arguments
      } else if (args.length === 1) {
        return []; // Return empty array for one argument
      } else {
        return 0; // Return 0 for multiple arguments
      }
    }) as any;
    next();
  },

  session: (req: Request, res: Response, next: NextFunction) => {
    req.session = { user: null } as any;
    next();
  }
};