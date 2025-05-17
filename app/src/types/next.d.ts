/**
 * Type extensions for Next.js request objects
 */

import { AuthInfo } from './auth';
import { NextRequest } from 'next/server';

declare module 'next/server' {
  interface NextRequest {
    /**
     * Auth information added by auth middleware
     */
    auth?: AuthInfo;
  }
}
