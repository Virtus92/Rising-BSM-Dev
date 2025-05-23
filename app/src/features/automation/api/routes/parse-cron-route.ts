/**
 * Parse Cron Expression API Route
 * 
 * POST /api/automation/cron/parse
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';
import { ParseCronExpressionRequest } from '../models';

/**
 * Parse cron expression endpoint
 */
export async function parseCronExpressionRoute(request: NextRequest) {
  const logger = new LoggingService();
  
  try {
    logger.info('POST /api/automation/cron/parse - Parsing cron expression');
    
    // Parse request body
    const body: ParseCronExpressionRequest = await request.json();
    
    // Validate required fields
    if (!body.cronExpression) {
      // FIXED: Return formatResponse directly
      return formatResponse.error('Cron expression is required', 400);
    }
    
    // Get automation service
    const automationService = await getAutomationService();
    
    // Parse cron expression
    const result = await automationService.parseCronExpression(
      body.cronExpression,
      body.timezone || 'UTC'
    );
    
    logger.info('Cron expression parsed successfully', { 
      isValid: result.isValid,
      expression: body.cronExpression 
    });
    
    // FIXED: Return formatResponse directly
    return formatResponse.success(result);
    
  } catch (error) {
    logger.error('Error parsing cron expression', { error });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to parse cron expression';
    
    // FIXED: Return formatResponse directly
    return formatResponse.error(message, statusCode);
  }
}
