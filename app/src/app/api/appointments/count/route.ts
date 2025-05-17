/**
 * GET /api/appointments/count
 * Returns the total count of appointments in the system
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

export const GET = routeHandler(
  permissionMiddleware.withPermission(
    async (request: NextRequest) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      try {
        // Get the appointment service
        const appointmentService = serviceFactory.createAppointmentService();
        
        // Context for service calls
        const context = { userId: request.auth?.userId };
        
        // Extract filters from query parameters
        const { searchParams } = new URL(request.url);
        const filters = {
          status: searchParams.get('status') || undefined,
          startDate: searchParams.get('startDate') 
            ? new Date(searchParams.get('startDate') as string) 
            : undefined,
          endDate: searchParams.get('endDate') 
            ? new Date(searchParams.get('endDate') as string) 
            : undefined,
          customerId: searchParams.has('customerId') 
            ? parseInt(searchParams.get('customerId') as string) 
            : undefined
        };
        
        // Get count from service with any filters
        try {
          const result = await appointmentService.count({
            context,
            filters
          });
          
          // Ensure we have a proper count response
          let count = 0;
          
          if (result && typeof result === 'object' && 'count' in result) {
            count = result.count as number;
          } else if (typeof result === 'number') {
            count = result;
          } else if (result && typeof result === 'object') {
            // Use type assertion to avoid 'never' type issues
            const resultObj = result as Record<string, any>;
            if ('total' in resultObj) {
              count = resultObj.total;
            }
          }
          
          return formatResponse.success({ count }, 'Appointment count retrieved successfully');
        } catch (serviceError) {
          logger.warn('Error retrieving appointment count from service, trying repository directly:', {
            error: serviceError instanceof Error ? serviceError.message : String(serviceError)
          });
          
          // Fallback to using repository directly
          const repositoryResult = await appointmentService.getRepository().count(filters);
          
          // Ensure we have a proper count response even from repository
          let count = 0;
          
          if (typeof repositoryResult === 'number') {
            count = repositoryResult;
          } else if (repositoryResult && typeof repositoryResult === 'object') {
            if ('count' in repositoryResult) {
              count = repositoryResult.count as number;
            } else if ('total' in repositoryResult) {
              count = repositoryResult.total as number;
            }
          }
          
          return formatResponse.success({ count }, 'Appointment count retrieved through fallback method');
        }
      } catch (error) {
        logger.error('Error counting appointments:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        return formatResponse.error(
          error instanceof Error ? error.message : 'Failed to retrieve appointment count',
          500
        );
      }
    },
    SystemPermission.APPOINTMENTS_VIEW
  ),
  {
    // Secure this endpoint
    requiresAuth: true
  }
);
