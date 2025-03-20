import 'express-session';

declare global {
  namespace Express {
    interface Request {
      flash(type: string, message?: any): any;
      flash(type: string): any[];
    }
  }
}