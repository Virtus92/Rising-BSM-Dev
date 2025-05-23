/**
 * Get Executions API Route
 * 
 * GET /api/automation/executions
 */

import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';
import { AutomationType, AutomationExecutionStatus } from '@/domain/entities/AutomationExecution';

/**
 * Get executions endpoint
 */
export async function getExecutionsRoute(request: NextRequest) {
  const logger = new LoggingService();
  
  try {
    logger.info('GET /api/automation/executions - Getting executions');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Convert string values to proper enum types
    const automationTypeParam = searchParams.get('automationType');
    const statusParam = searchParams.get('status');
    
    const filters = {
      automationType: automationTypeParam && Object.values(AutomationType).includes(automationTypeParam as AutomationType)
        ? automationTypeParam as AutomationType
        : undefined,
      automationId: searchParams.get('automationId') ? parseInt(searchParams.get('automationId')!) : undefined,
      status: statusParam && Object.values(AutomationExecutionStatus).includes(statusParam as AutomationExecutionStatus)
        ? statusParam as AutomationExecutionStatus
        : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 10,
      sortBy: searchParams.get('sortBy') || 'executedAt',
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
    
    // Get executions
    const result = await automationService.getExecutions(filters);
    
    // Ensure result has proper structure
    const executionsData = result?.data || [];
    const responseData = {
      data: executionsData,
      total: result?.total || executionsData.length,
      page: result?.page || filters.page || 1,
      pageSize: result?.pageSize || filters.pageSize || 10
    };
    
    logger.info('Executions retrieved successfully', { 
      count: executionsData.length, 
      total: responseData.total,
      page: responseData.page,
      pageSize: responseData.pageSize
    });
    
    // FIXED: Return paginated data directly in success response
    return formatResponse.success(responseData);
    
  } catch (error) {
    logger.error('Error getting executions', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get executions';
    
    return formatResponse.error(message, statusCode);
  }
}
