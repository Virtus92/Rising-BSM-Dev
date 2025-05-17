/**
 * Type declaration for NextRequest auth extension
 * 
 * This file extends the Next.js types to include authentication information
 * in the NextRequest object.
 */

import { AuthInfo } from './auth';

declare module 'next/server' {
  interface NextRequest {
    auth?: AuthInfo;
  }
}
