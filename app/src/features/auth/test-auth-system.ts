/**
 * Export function types to enable reuse in type definitions
 * Note: The actual function implementations are exported directly below
 */
export type TestAuthSystemType = typeof testAuthSystem;
export type TestPermissionSystemType = typeof testPermissionSystem;

/**
 * Authentication System Integration Test
 * 
 * This file provides a simple way to test the authentication system.
 * It's not meant to be included in production builds but helps during development.
 */

import AuthService from './core/AuthService';
import { ApiClient } from '@/core/api/ApiClient';

/**
 * Test the authentication system
 * Run this function from the browser console:
 * import { testAuthSystem } from '@/features/auth/test-auth-system';
 * testAuthSystem();
 */
export async function testAuthSystem() {
  console.group('🔒 Authentication System Test');
  console.log('Starting authentication system test...');
  
  // Step 1: Initialize AuthService
  console.log('Step 1: Initializing AuthService...');
  const authInitialized = await AuthService.initialize();
  console.log('AuthService initialized:', authInitialized);
  
  // Step 2: Validate current token
  console.log('Step 2: Validating current token...');
  const validationResult = await AuthService.validateToken();
  console.log('Token validation result:', validationResult);
  
  if (validationResult) {
    console.log('Token is valid! User is authenticated.');
    
    // Step 3: Get user info
    const user = await AuthService.getCurrentUser();
    console.log('Current user:', user);
    
    // Step 4: Make an authenticated API request
    console.log('Making an authenticated API request...');
    const response = await ApiClient.get('/users/me');
    console.log('API response:', response);
    
    // Step 5: Test token refresh
    console.log('Testing token refresh...');
    const refreshResult = await AuthService.refreshToken();
    console.log('Token refresh result:', refreshResult.success);
  } else {
    console.log('Token is invalid or missing. User is not authenticated.');
    console.log('Use AuthService.login() to authenticate.');
  }
  
  console.log('Authentication system test complete!');
  console.groupEnd();
  
  // Return helpful functions for console testing
  return {
    login: async (email: string, password: string) => {
      console.group('Login Test');
      console.log('Attempting login with:', { email });
      const result = await AuthService.login({ email, password });
      console.log('Login result:', result);
      console.groupEnd();
      return result;
    },
    logout: async () => {
      console.group('Logout Test');
      console.log('Logging out...');
      const user = AuthService.getUser();
      if (user) {
        await AuthService.logout(user.id);
      } else {
        await AuthService.signOut();
      }
      console.log('Logout complete');
      console.groupEnd();
    },
    refreshToken: async () => {
      console.group('Token Refresh Test');
      console.log('Refreshing token...');
      const result = await AuthService.refreshToken();
      console.log('Refresh result:', result);
      console.groupEnd();
      return result.success;
    },
    validateToken: async () => {
      console.group('Token Validation Test');
      console.log('Validating token...');
      const result = await AuthService.validateToken();
      console.log('Validation result:', result);
      console.groupEnd();
      return result;
    },
    getUser: async () => {
      console.group('Get User Test');
      console.log('Getting current user...');
      const user = await AuthService.getCurrentUser();
      console.log('User:', user);
      console.groupEnd();
      return user;
    }
  };
}

/**
 * Test the permission system
 * Can be run from browser console after importing
 */
export async function testPermissionSystem() {
  console.group('🔑 Permission System Test');
  console.log('Starting permission system test...');
  
  try {
    // Step 1: Get the current user
    console.log('Step 1: Getting current user...');
    const currentUser = await AuthService.getCurrentUser();
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
      console.error('User not authenticated. Please log in first.');
      console.groupEnd();
      return;
    }
    
    // Step 2: Make direct API calls to test permission endpoints
    console.log('Step 2: Testing permission endpoints...');
    
    // Get all permissions
    const allPermissionsResponse = await ApiClient.get('/api/permissions');
    console.log('All permissions:', allPermissionsResponse);
    
    // Get user permissions
    const userPermissionsResponse = await ApiClient.get(`/api/users/permissions?userId=${currentUser.id}`);
    console.log('User permissions:', userPermissionsResponse);
    
    // Check specific permissions
    if (userPermissionsResponse.success && 
        userPermissionsResponse.data && 
        Array.isArray(userPermissionsResponse.data.permissions)) {
      
      console.log('Step 3: Testing specific permissions...');
      
      // Test each permission
      const permissions = userPermissionsResponse.data.permissions;
      for (const perm of permissions.slice(0, 5)) { // Test first 5 for brevity
        const permCode = typeof perm === 'string' ? perm : (perm).code || perm;
        console.log(`Testing permission: ${permCode}`);
        
        const checkResponse = await ApiClient.post('/api/users/permissions/check', {
          userId: currentUser.id,
          permissions: [permCode]
        });
        
        console.log(`Permission ${permCode}: ${checkResponse.data?.hasPermission ? 'YES' : 'NO'}`);
      }
      
      // Test a random permission that likely doesn't exist
      const fakePermission = `TEST_PERMISSION_${Date.now()}`;
      console.log(`Testing non-existent permission: ${fakePermission}`);
      
      const fakeCheckResponse = await ApiClient.post('/api/users/permissions/check', {
        userId: currentUser.id,
        permissions: [fakePermission]
      });
      
      console.log(`Permission ${fakePermission}: ${fakeCheckResponse.data?.hasPermission ? 'YES' : 'NO'}`);
    }
  } catch (error) {
    console.error('Error during permission system test:', error);
  }
  
  console.log('Permission system test complete!');
  console.groupEnd();
  
  // Return helpful functions for console testing
  return {
    getAllPermissions: async () => {
      const result = await ApiClient.get('/api/permissions');
      console.log('All permissions:', result);
      return result;
    },
    getUserPermissions: async () => {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return null;
      
      const result = await ApiClient.get(`/api/users/permissions?userId=${currentUser.id}`);
      console.log('User permissions:', result);
      return result;
    },
    checkPermission: async (permissionCode: string) => {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        console.error('User not authenticated');
        return { success: false, data: false, message: 'User not authenticated' };
      }
      
      const result = await ApiClient.post('/api/users/permissions/check', {
        userId: currentUser.id,
        permissions: [permissionCode]
      });
      
      console.log(`Permission ${permissionCode}:`, result);
      return result;
    }
  };
}

// Declare global augmentation for window object
declare global {
  interface Window {
    __testAuth: typeof testAuthSystem;
    __testPermissions: typeof testPermissionSystem;
  }
}

// Add to window object for easier testing in console
if (typeof window !== 'undefined') {
  window.__testAuth = testAuthSystem;
  window.__testPermissions = testPermissionSystem;
}