/**
 * Create Schedule API Route
 * 
 * POST /api/automation/schedules
 */

import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';
import { CreateScheduleRequest } from '../models';

/**
 * Create schedule endpoint
 */
export async function createScheduleRoute(request: NextRequest) {
  const logger = new LoggingService();
  
  try {
    logger.info('POST /api/automation/schedules - Creating schedule');
    
    // Parse request body
    let body: CreateScheduleRequest;
    try {
      const rawBody = await request.text();
      logger.debug('Raw request body', { 
        bodyLength: rawBody.length,
        bodyPreview: rawBody.substring(0, 200)
      });
      
      body = JSON.parse(rawBody);
      logger.info('Request body parsed successfully', { 
        bodyKeys: Object.keys(body || {}),
        hasRequiredFields: {
          name: !!body?.name,
          cronExpression: !!body?.cronExpression,
          webhookUrl: !!body?.webhookUrl
        }
      });
    } catch (parseError) {
      logger.error('Failed to parse request body', { 
        error: parseError,
        errorMessage: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      });
      return formatResponse.error('Invalid JSON in request body', 400);
    }
    
    // Validate required fields
    if (!body || typeof body !== 'object') {
      logger.error('Invalid request body type', { bodyType: typeof body });
      return formatResponse.error('Invalid request body', 400);
    }
    
    const missingFields = [];
    if (!body.name) missingFields.push('name');
    if (!body.cronExpression) missingFields.push('cronExpression');
    if (!body.webhookUrl) missingFields.push('webhookUrl');
    
    if (missingFields.length > 0) {
      logger.error('Missing required fields', { 
        missingFields,
        providedFields: Object.keys(body)
      });
      return formatResponse.error(`Missing required fields: ${missingFields.join(', ')}`, 400);
    }
    
    // Get automation service
    const automationService = await getAutomationService();
    
    // Ensure service is available
    if (!automationService) {
      logger.error('Automation service not available');
      return formatResponse.error('Service temporarily unavailable', 503);
    }
    
    // Create schedule
    logger.info('Creating schedule with service', {
      name: body.name,
      cronExpression: body.cronExpression,
      webhookUrl: body.webhookUrl,
      timezone: body.timezone || 'UTC'
    });
    
    const schedule = await automationService.createSchedule({
      name: body.name,
      description: body.description || '',
      cronExpression: body.cronExpression,
      webhookUrl: body.webhookUrl,
      headers: body.headers || {},
      payload: body.payload || {},
      timezone: body.timezone || 'UTC',
      active: body.active !== undefined ? body.active : true
    });
    
    if (!schedule) {
      logger.error('Service returned null schedule');
      return formatResponse.error('Failed to create schedule', 500);
    }
    
    logger.info('Schedule created successfully', { 
      scheduleId: schedule.id,
      scheduleName: schedule.name
    });
    
    // FIXED: Return formatResponse directly with 201 status
    return formatResponse.success(schedule, 'Schedule created successfully', 201);
    
  } catch (error) {
    logger.error('Error creating schedule', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to create schedule';
    
    return formatResponse.error(message, statusCode);
  }
}
