import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { apiPermissions } from '../../helpers/apiPermissions';

/**
 * GET /api/requests/data
 * Get structured data for a request
 */
export const GET = apiRouteHandler(
  apiPermissions.withPermission(
    async (req: NextRequest) => {
      const { searchParams } = new URL(req.url);
      const requestId = searchParams.get('requestId');
      const category = searchParams.get('category');
      
      if (!requestId) {
        return formatResponse.error('Missing requestId parameter');
      }
      
      const logger = getLogger();
      logger.info('Retrieving request data', { requestId, category });
      
      const serviceFactory = getServiceFactory();
      const requestDataService = serviceFactory.createRequestDataService();
      
      try {
        // Ensure requestId is parsed as a number
        const parsedRequestId = parseInt(requestId, 10);
        if (isNaN(parsedRequestId)) {
          return formatResponse.error('Invalid requestId parameter');
        }
        
        const result = await requestDataService.findRequestData(
          parsedRequestId, 
          category || undefined
        );
        
        return formatResponse.success(
          result,
          'Request data retrieved successfully'
        );
      } catch (error) {
        logger.error('Error retrieving request data', {
          error: error instanceof Error ? error.message : String(error),
          requestId,
          category
        });
        
        return formatResponse.error(
          'Failed to retrieve request data',
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);

/**
 * POST /api/requests/data
 * Create structured data for a request
 */
export const POST = apiRouteHandler(
  apiPermissions.withPermission(
    async (req: NextRequest) => {
      const data = await req.json();
      
      if (!data.requestId) {
        return formatResponse.error('Missing requestId parameter');
      }
      
      const logger = getLogger();
      logger.info('Creating request data', { requestId: data.requestId, category: data.category });
      
      const serviceFactory = getServiceFactory();
      const requestDataService = serviceFactory.createRequestDataService();
      
      try {
        // Ensure the API properly provides a number to the service
        // Convert requestId to a number since it's required as a number type
        const requestData = {
          ...data,
          requestId: typeof data.requestId === 'string' ? parseInt(data.requestId, 10) : data.requestId
        };
        
        // Validate the parsed requestId
        if (typeof requestData.requestId !== 'number' || isNaN(requestData.requestId)) {
          return formatResponse.error('Invalid requestId parameter: must be a number');
        }
        
        const result = await requestDataService.createRequestData(requestData, {
          context: {
            userId: req.auth?.userId,
            source: 'api'
          }
        });
        
        return formatResponse.success(
          result,
          'Request data created successfully',
          201
        );
      } catch (error) {
        logger.error('Error creating request data', {
          error: error instanceof Error ? error.message : String(error),
          data
        });
        
        return formatResponse.error(
          'Failed to create request data',
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    SystemPermission.REQUESTS_MANAGE
  ),
  { requiresAuth: true }
);

/**
 * PUT /api/requests/data/[id]
 * Update structured data for a request
 */
export const PUT = apiRouteHandler(
  apiPermissions.withPermission(
    async (req: NextRequest) => {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      
      if (!id) {
        return formatResponse.error('Missing id parameter');
      }
      
      const data = await req.json();
      
      const logger = getLogger();
      logger.info('Updating request data', { id, category: data.category });
      
      const serviceFactory = getServiceFactory();
      const requestDataService = serviceFactory.createRequestDataService();
      
      try {
        // Ensure id is parsed as a number
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
          return formatResponse.error('Invalid id parameter');
        }
        
        const result = await requestDataService.updateRequestData(parsedId, data, {
          context: {
            userId: req.auth?.userId,
            source: 'api'
          }
        });
        
        return formatResponse.success(
          result,
          'Request data updated successfully'
        );
      } catch (error) {
        logger.error('Error updating request data', {
          error: error instanceof Error ? error.message : String(error),
          id,
          data
        });
        
        return formatResponse.error(
          'Failed to update request data',
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    SystemPermission.REQUESTS_MANAGE
  ),
  { requiresAuth: true }
);