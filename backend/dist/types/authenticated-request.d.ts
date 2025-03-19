import { Request } from 'express';
export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
}
export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}
