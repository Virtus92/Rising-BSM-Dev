/**
 * API Routes for Request Data Management
 * 
 * Handles structured data associated with requests
 */
import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * GET /api/requests/data
 * Get structured data for a request
 */
export const GET = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using the correct pattern with role
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.REQUESTS_VIEW,
      req.auth?.role
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.REQUESTS_VIEW}`);
      return NextResponse.json(
        formatResponse.error('You dont have permission to view request data', 403),
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');
    const category = searchParams.get('category');
    
    if (!requestId) {
      return NextResponse.json(
        formatResponse.error('Missing requestId parameter', 400),
        { status: 400 }
      );
    }
    
    logger.info('Retrieving request data', { requestId, category });
    
    const requestDataService = serviceFactory.createRequestDataService();
    
    // Ensure requestId is parsed as a number
    const parsedRequestId = parseInt(requestId, 10);
    if (isNaN(parsedRequestId)) {
      return NextResponse.json(
        formatResponse.error('Invalid requestId parameter', 400),
        { status: 400 }
      );
    }
    
    const result = await requestDataService.findRequestData(
      parsedRequestId, 
      category || undefined
    );
    
    return NextResponse.json(
      formatResponse.success(
        result,
        'Request data retrieved successfully'
      ),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error retrieving request data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        'Failed to retrieve request data: ' + (error instanceof Error ? error.message : String(error)),
        500
      ),
      { status: 500 }
    );
  }
}, { requiresAuth: true });

/**
 * POST /api/requests/data
 * Create structured data for a request
 */
export const POST = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using the correct pattern with role
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.REQUESTS_EDIT,
      req.auth?.role
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.REQUESTS_EDIT}`);
      return NextResponse.json(
        formatResponse.error('You dont have permission to create request data', 403),
        { status: 403 }
      );
    }
    
    const data = await req.json();
    
    if (!data.requestId) {
      return NextResponse.json(
        formatResponse.error('Missing requestId parameter', 400),
        { status: 400 }
      );
    }
    
    logger.info('Creating request data', { requestId: data.requestId, category: data.category });
    
    const requestDataService = serviceFactory.createRequestDataService();
    
    // Ensure the API properly provides a number to the service
    // Convert requestId to a number since it's required as a number type
    const requestData = {
      ...data,
      requestId: typeof data.requestId === 'string' ? parseInt(data.requestId, 10) : data.requestId
    };
    
    // Validate the parsed requestId
    if (typeof requestData.requestId !== 'number' || isNaN(requestData.requestId)) {
      return NextResponse.json(
        formatResponse.error('Invalid requestId parameter: must be a number', 400),
        { status: 400 }
      );
    }
    
    const result = await requestDataService.createRequestData(requestData, {
      context: {
        userId: req.auth?.userId,
        source: 'api'
      }
    });
    
    return NextResponse.json(
      formatResponse.success(
        result,
        'Request data created successfully'
      ),
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating request data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        'Failed to create request data: ' + (error instanceof Error ? error.message : String(error)),
        500
      ),
      { status: 500 }
    );
  }
}, { requiresAuth: true });

/**
 * PUT /api/requests/data
 * Update structured data for a request
 */
export const PUT = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using the correct pattern with role
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.REQUESTS_EDIT,
      req.auth?.role
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.REQUESTS_EDIT}`);
      return NextResponse.json(
        formatResponse.error('You dont have permission to update request data', 403),
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        formatResponse.error('Missing id parameter', 400),
        { status: 400 }
      );
    }
    
    const data = await req.json();
    
    logger.info('Updating request data', { id, category: data.category });
    
    const requestDataService = serviceFactory.createRequestDataService();
    
    // Ensure id is parsed as a number
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        formatResponse.error('Invalid id parameter', 400),
        { status: 400 }
      );
    }
    
    const result = await requestDataService.updateRequestData(parsedId, data, {
      context: {
        userId: req.auth?.userId,
        source: 'api'
      }
    });
    
    return NextResponse.json(
      formatResponse.success(
        result,
        'Request data updated successfully'
      ),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error updating request data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        'Failed to update request data: ' + (error instanceof Error ? error.message : String(error)),
        500
      ),
      { status: 500 }
    );
  }
}, { requiresAuth: true });
