/**
 * Centralized authentication middleware exports
 * 
 * This file provides a single point of import for all middleware
 * functions, ensuring consistent usage across the application.
 */

import {
  auth,
  withAuth as apiWithAuth,
  apiAuth as apiAuthFunction,
  authenticateRequest as apiAuthenticateRequest,
  extractAuthToken as apiExtractAuthToken,
  getUserFromRequest as apiGetUserFromRequest,
} from '../api/middleware/authMiddleware';

import type { AuthOptions, AuthResult } from '../api/middleware/authMiddleware';

// Re-export the centralized middleware
export const withAuth = auth;
export const apiAuth = auth;
export const authenticateRequest = apiAuthenticateRequest;
export const extractAuthToken = apiExtractAuthToken;
export const getUserFromRequest = apiGetUserFromRequest;

export {
  auth,
  type AuthOptions,
  type AuthResult
};
