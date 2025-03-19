import { Request } from 'express';

// Define the user structure in the authenticated request
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}