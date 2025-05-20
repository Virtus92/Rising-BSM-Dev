/**
 * Next.js request augmentation for auth properties
 */
import { NextRequest } from 'next/server';

// Extend NextRequest to include auth property
declare module 'next/server' {
  interface NextRequest {
    auth?: {
      userId: number;
      email: string;
      role: string;
      name?: string;
      user: {
        id: number;
        email: string;
        role: string;
        name?: string;
      };
    };
  }
}
