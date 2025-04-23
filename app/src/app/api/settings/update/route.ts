/**
 * Settings Update API Route
 * 
 * This route provides a dedicated endpoint for updating individual system settings.
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * PUT /api/settings/update
 * Updates a specific system setting
 */
export const PUT = apiRouteHandler(
  async (request: NextRequest) => {
    const logger = getLogger();
    
    try {
      const { key, value } = await request.json();
      
      if (!key) {
        return formatError('Setting key is required', 400);
      }
      
      // Log the update request
      logger.info('Updating system setting', { key, value });
      
      // In a complete implementation, we would update the setting in the database
      // For now, simulate a successful update
      
      // Whitelist of allowed settings to update
      const allowedSettings = [
        'companyName',
        'companyLogo',
        'companyEmail',
        'companyPhone',
        'companyAddress',
        'companyWebsite',
        'dateFormat',
        'timeFormat',
        'currency',
        'language',
        'theme',
        'notificationsEnabled',
        'emailNotifications',
      ];
      
      if (!allowedSettings.includes(key)) {
        return formatError(`Setting '${key}' cannot be updated`, 400);
      }
      
      // Simulate successful update
      return formatSuccess({
        key,
        value,
        updated: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error updating setting', { error: error instanceof Error ? error.message : 'Unknown error' });
      return formatError('Failed to update setting', 500);
    }
  },
  {
    // Require authentication for updating settings
    requiresAuth: true,
    // Only administrators can update settings
    requiresRole: ['admin']
  }
);