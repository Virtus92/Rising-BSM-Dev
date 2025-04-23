import { NextRequest as OriginalNextRequest } from 'next/server';

declare module 'next/server' {
  interface AuthData {
    userId?: number;
    role?: string;
    email?: string;
    name?: string;
    [key: string]: any;
  }

  interface NextRequest extends OriginalNextRequest {
    auth?: AuthData;
  }
}