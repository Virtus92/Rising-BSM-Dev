/**
 * Client-safe middleware utilities
 * This file contains API middleware functions that can be safely imported in client components
 */
'use client';

import { NextResponse } from 'next/server';
import { AuthInfo } from './types';
import { getItem } from '@/shared/utils/storage/cookieStorage';

/**
 * Helper functions for working with authentication in API requests
 * These are client-safe functions that don't depend on server-only code
 */
export const authHelpers = {
  /**
   * Extracts auth info from client-side context
   * Client-safe implementation that doesn't import server-only code
   */
  getAuthInfo(): AuthInfo | null {
    // In client context, get auth info from localStorage or memory cache
    if (typeof window !== 'undefined') {
      try {
        // Try to get from memory cache first
        if ((window as any).__AUTH_PROVIDER_STATE_KEY?.user?.id) {
          const user = (window as any).__AUTH_PROVIDER_STATE_KEY.user;
          return {
            userId: user.id,
            role: user.role,
            name: user.name,
            email: user.email
          };
        }
        
        // Fall back to localStorage
        const authDataStr = getItem('auth_user_data');
        if (authDataStr) {
          try {
            const authData = JSON.parse(authDataStr);
            if (authData && authData.id) {
              return {
                userId: authData.id,
                role: authData.role,
                name: authData.name,
                email: authData.email
              };
            }
          } catch (e) {
            console.error('Error parsing auth data from localStorage', e);
          }
        }
      } catch (e) {
        console.error('Error accessing auth info in client context', e);
      }
    }
    return null;
  }
};

/**
 * Client-safe error response helpers
 * These functions help create consistent error responses without server dependencies
 */
export const formatResponseClient = {
  /**
   * Format a successful response
   */
  success<T>(data: T, message: string = 'Success'): NextResponse {
    return NextResponse.json({
      success: true,
      message,
      data
    });
  },
  
  /**
   * Format an error response (400 Bad Request)
   */
  badRequest(message: string = 'Bad Request', details?: any): NextResponse {
    return NextResponse.json({
      success: false,
      message,
      details
    }, { status: 400 });
  },
  
  /**
   * Format an unauthorized response (401)
   */
  unauthorized(message: string = 'Unauthorized', details?: any): NextResponse {
    return NextResponse.json({
      success: false,
      message,
      details
    }, { status: 401 });
  },
  
  /**
   * Format a forbidden response (403)
   */
  forbidden(message: string = 'Forbidden', details?: any): NextResponse {
    return NextResponse.json({
      success: false,
      message,
      details
    }, { status: 403 });
  },
  
  /**
   * Format a not found response (404)
   */
  notFound(message: string = 'Not Found', details?: any): NextResponse {
    return NextResponse.json({
      success: false,
      message,
      details
    }, { status: 404 });
  },
  
  /**
   * Format a generic error response
   */
  error(message: string = 'Internal Server Error', status: number = 500, details?: any): NextResponse {
    return NextResponse.json({
      success: false,
      message,
      details
    }, { status });
  }
};