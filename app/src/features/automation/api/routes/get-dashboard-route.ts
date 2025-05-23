/**
 * Get Dashboard API Route
 * 
 * GET /api/automation/dashboard
 */

import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';

/**
 * Get automation dashboard data endpoint
 */
export async function getDashboardRoute(request: NextRequest) {
  const logger = new LoggingService();
  
  try {
    logger.info('GET /api/automation/dashboard - Getting dashboard data');
    
    // Get automation service
    const automationService = await getAutomationService();
    
    // Ensure service is available
    if (!automationService) {
      logger.error('Automation service not available');
      return formatResponse.error('Service temporarily unavailable', 503);
    }
    
    // Get dashboard data
    const dashboardData = await automationService.getDashboardData();
    
    logger.info('Dashboard data retrieved successfully', {
      totalWebhooks: dashboardData.totalWebhooks,
      totalSchedules: dashboardData.totalSchedules,
      totalExecutions: dashboardData.totalExecutions,
      successRate: `${dashboardData.successRate.toFixed(1)}%`
    });
    
    // FIXED: Return formatResponse directly
    return formatResponse.success(dashboardData);
    
  } catch (error) {
    logger.error('Error getting dashboard data', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    // FIXED: Return empty dashboard data on error to prevent frontend crashes
    const emptyDashboard = {
      totalWebhooks: 0,
      activeWebhooks: 0,
      totalSchedules: 0,
      activeSchedules: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      successRate: 0,
      recentExecutions: [],
      topFailedAutomations: []
    };
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get dashboard data';
    
    // Return error with empty data to allow graceful degradation
    return formatResponse.error(message, statusCode);
  }
}
