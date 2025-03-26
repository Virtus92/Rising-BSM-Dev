import { Request } from 'express';

/**
 * Erweitert den Standard-Request-Typ mit Benutzerinformationen
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
    email: string;
    [key: string]: any;
  };
}