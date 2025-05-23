/**
 * Get Webhooks API Route
 * 
 * GET /api/automation/webhooks
 */

import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';
import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';

/**
 * Get webhooks endpoint
 */
export async function getWebhooksRoute(request: NextRequest) {
  const logger = new LoggingService();
  
  try {
    logger.info('GET /api/automation/webhooks - Getting webhooks');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Convert string values to proper enum types
    const entityTypeParam = searchParams.get('entityType');
    const operationParam = searchParams.get('operation');
    
    const filters = {
      entityType: entityTypeParam && Object.values(AutomationEntityType).includes(entityTypeParam as AutomationEntityType) 
        ? entityTypeParam as AutomationEntityType 
        : undefined,
      operation: operationParam && Object.values(AutomationOperation).includes(operationParam as AutomationOperation)
        ? operationParam as AutomationOperation
        : undefined,
      active: searchParams.get('active') ? searchParams.get('active') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
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
    
    // Get webhooks
    const result = await automationService.getWebhooks(filters);
    
    // Ensure result has proper structure
    const webhooksData = result?.data || [];
    const responseData = {
      data: webhooksData,
      total: result?.total || webhooksData.length,
      page: result?.page || filters.page || 1,
      pageSize: result?.pageSize || filters.pageSize || 10
    };
    
    logger.info('Webhooks retrieved successfully', { 
      count: webhooksData.length, 
      total: responseData.total,
      page: responseData.page,
      pageSize: responseData.pageSize
    });
    
    // FIXED: Return paginated data directly in success response
    // The frontend expects the paginated data structure directly in the data field
    return formatResponse.success(responseData);
    
  } catch (error) {
    logger.error('Error getting webhooks', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get webhooks';
    
    // FIXED: Return formatResponse directly
    return formatResponse.error(message, statusCode);
  }
}
