/**
 * DEPRECATED: This module has been replaced by the new auth system
 * 
 * All functionality has been moved to @/core/api/ApiClient.ts
 */

import { ApiClient } from '@/core/api/ApiClient';

// Re-export as AuthClient for legacy compatibility
export const AuthClient = ApiClient;

export default ApiClient;
