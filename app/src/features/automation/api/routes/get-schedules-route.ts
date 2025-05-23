/**
 * Get Schedules API Route
 * 
 * GET /api/automation/schedules
 */

import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';

/**
 * Get schedules endpoint
 */
export async function getSchedulesRoute(request: NextRequest) {
  const logger = new LoggingService();
  
  try {
    logger.info('GET /api/automation/schedules - Getting schedules');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const filters = {
      active: searchParams.get('active') ? searchParams.get('active') === 'true' : undefined,
      timezone: searchParams.get('timezone') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 10,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    };
    
    // Validate page parameters
    if (filters.page < 1) filters.page = 1;
    if (filters.pageSize < 1 || filters.pageSize > 100) filters.pageSize = 10;
    
    // Get automation service
    const automationService = await getAutomationService();
    
    // Ensure service is available
    if (!automationService) {
      logger.error('Automation service not available');
      return formatResponse.error('Service temporarily unavailable', 503);
    }
    
    // Get schedules
    const result = await automationService.getSchedules(filters);
    
    // Ensure result has proper structure
    const schedulesData = result?.data || [];
    const responseData = {
      data: schedulesData,
      total: result?.total || schedulesData.length,
      page: result?.page || filters.page || 1,
      pageSize: result?.pageSize || filters.pageSize || 10
    };
    
    logger.info('Schedules retrieved successfully', { 
      count: schedulesData.length, 
      total: responseData.total,
      page: responseData.page,
      pageSize: responseData.pageSize
    });
    
    // FIXED: Return paginated data directly in success response
    return formatResponse.success(responseData);
    
  } catch (error) {
    logger.error('Error getting schedules', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get schedules';
    
    return formatResponse.error(message, statusCode);
  }
}
