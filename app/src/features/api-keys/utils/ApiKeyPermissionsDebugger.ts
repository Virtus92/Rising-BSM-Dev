/**
 * API Key Permissions Debugging Utility
 * 
 * This utility helps debug issues with API key permissions not being displayed
 * by providing detailed logging and testing functionality.
 */

import { ApiKeyResponseDto } from '@/domain/dtos/ApiKeyDtos';

export class ApiKeyPermissionsDebugger {
  /**
   * Debug an API key's permission data
   */
  static debugApiKey(apiKey: ApiKeyResponseDto | null, context: string = 'Unknown') {
    console.group(`🔍 API Key Debug - ${context}`);
    
    if (!apiKey) {
      console.warn('❌ API Key is null/undefined');
      console.groupEnd();
      return;
    }

    console.log('📋 Basic Info:', {
      id: apiKey.id,
      name: apiKey.name,
      type: apiKey.type,
      status: apiKey.status,
      environment: apiKey.environment
    });

    console.log('🔐 Permissions Info:', {
      permissionsProperty: apiKey.permissions,
      permissionsType: typeof apiKey.permissions,
      permissionsIsArray: Array.isArray(apiKey.permissions),
      permissionsLength: apiKey.permissions?.length,
      permissionsStringified: JSON.stringify(apiKey.permissions)
    });

    if (apiKey.permissions && Array.isArray(apiKey.permissions)) {
      console.log('📝 Individual Permissions:');
      apiKey.permissions.forEach((permission, index) => {
        console.log(`  ${index + 1}. ${permission} (${typeof permission})`);
      });
    }

    // Check for common issues
    const issues = [];
    if (apiKey.type === 'standard' && (!apiKey.permissions || apiKey.permissions.length === 0)) {
      issues.push('Standard API key has no permissions assigned');
    }
    if (apiKey.permissions === null) {
      issues.push('Permissions property is explicitly null');
    }
    if (apiKey.permissions === undefined) {
      issues.push('Permissions property is undefined');
    }

    if (issues.length > 0) {
      console.warn('⚠️ Potential Issues:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    } else {
      console.log('✅ No obvious issues detected');
    }

    console.groupEnd();
  }

  /**
   * Debug the entire API keys list
   */
  static debugApiKeysList(apiKeys: ApiKeyResponseDto[], context: string = 'Unknown') {
    console.group(`🔍 API Keys List Debug - ${context}`);
    
    console.log(`📊 Summary: ${apiKeys.length} API keys found`);
    
    const summary = {
      total: apiKeys.length,
      withPermissions: 0,
      withoutPermissions: 0,
      nullPermissions: 0,
      undefinedPermissions: 0,
      standardKeys: 0,
      adminKeys: 0
    };

    apiKeys.forEach((apiKey, index) => {
      if (apiKey.type === 'standard') summary.standardKeys++;
      if (apiKey.type === 'admin') summary.adminKeys++;
      
      if (apiKey.permissions === null) summary.nullPermissions++;
      else if (apiKey.permissions === undefined) summary.undefinedPermissions++;
      else if (Array.isArray(apiKey.permissions) && apiKey.permissions.length > 0) summary.withPermissions++;
      else summary.withoutPermissions++;

      console.log(`${index + 1}. ${apiKey.name} (${apiKey.type}):`, {
        permissions: apiKey.permissions,
        permissionCount: apiKey.permissions?.length || 0
      });
    });

    console.log('📈 Summary Stats:', summary);
    console.groupEnd();
  }

  /**
   * Test API key permissions API endpoint
   */
  static async testPermissionsEndpoint(apiKeyId: number) {
    console.group(`🧪 Testing Permissions Endpoint for API Key ${apiKeyId}`);
    
    try {
      console.log('📡 Making request to permissions endpoint...');
      const response = await fetch(`/api/api-keys/${apiKeyId}/permissions`);
      const data = await response.json();
      
      console.log('📥 Response Status:', response.status);
      console.log('📥 Response Data:', data);
      
      if (data.success) {
        console.log('✅ Permissions endpoint working correctly');
        console.log('🔐 Permissions from API:', data.data?.permissions);
      } else {
        console.error('❌ Permissions endpoint returned error:', data.error);
      }
    } catch (error) {
      console.error('❌ Failed to test permissions endpoint:', error);
    }
    
    console.groupEnd();
  }

  /**
   * Compare API key data before and after fetching
   */
  static compareApiKeyData(before: any, after: ApiKeyResponseDto, context: string = 'Unknown') {
    console.group(`🔄 API Key Data Comparison - ${context}`);
    
    console.log('📋 Before:', before);
    console.log('📋 After:', after);
    
    if (before?.permissions !== after?.permissions) {
      console.log('🔄 Permissions changed:');
      console.log('  Before:', before?.permissions);
      console.log('  After:', after?.permissions);
    } else {
      console.log('🔒 Permissions unchanged');
    }
    
    console.groupEnd();
  }

  /**
   * Monitor permission updates
   */
  static monitorPermissionUpdate(apiKeyId: number, oldPermissions: string[], newPermissions: string[]) {
    console.group(`📝 Permission Update Monitor - API Key ${apiKeyId}`);
    
    console.log('🗂️ Old Permissions:', oldPermissions);
    console.log('🗂️ New Permissions:', newPermissions);
    
    const added = newPermissions.filter(p => !oldPermissions.includes(p));
    const removed = oldPermissions.filter(p => !newPermissions.includes(p));
    
    if (added.length > 0) {
      console.log('➕ Added Permissions:', added);
    }
    if (removed.length > 0) {
      console.log('➖ Removed Permissions:', removed);
    }
    if (added.length === 0 && removed.length === 0) {
      console.log('🔄 No changes detected');
    }
    
    console.groupEnd();
  }
}

// Export for easy import in components
export default ApiKeyPermissionsDebugger;
