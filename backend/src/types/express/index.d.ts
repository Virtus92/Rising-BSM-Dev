import 'express-session';
import 'express';

declare global {
  namespace Express {
    interface Request {
      flash(type: string, message?: any): any;
      csrfToken(): string;
    }
  }
}