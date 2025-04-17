import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { apiPermissions } from '../../../helpers/apiPermissions';

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * POST /api/requests/[id]/appointment
 * 
 * Erstellt einen Termin für eine Kontaktanfrage.
 */
export const POST = apiRouteHandler(
  apiPermissions.withPermission(
    async (req: NextRequest, { params }: RequestParams) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();

      const requestId = parseInt(params.id);
      if (isNaN(requestId)) {
        return formatResponse.error('Invalid request ID', 400);
      }
      
      // Parse request body
      const body = await req.json();
      const { 
        title, 
        appointmentDate, 
        appointmentTime, 
        duration = 60, 
        location, 
        description, 
        status = 'planned', 
        note 
      } = body;
      
      if (!title || !appointmentDate) {
        return formatResponse.error('Title and appointment date are required', 400);
      }
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      // Combine date and time
      let finalAppointmentDate;
      if (appointmentDate && appointmentTime) {
        const [year, month, day] = appointmentDate.split('-').map(Number);
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        finalAppointmentDate = new Date(year, month - 1, day, hours, minutes);
      } else {
        // Only date with default time (10:00)
        const [year, month, day] = appointmentDate.split('-').map(Number);
        finalAppointmentDate = new Date(year, month - 1, day, 10, 0);
      }
      
      // Create appointment data
      const appointmentData = {
        title,
        appointmentDate: finalAppointmentDate,
        duration,
        location,
        description,
        status
      };
      
      // Create appointment for request
      const result = await requestService.createAppointmentForRequest(
        requestId,
        appointmentData,
        note,
        { context }
      );
      
      return formatResponse.success(result, 'Appointment created successfully');
    },
    SystemPermission.REQUESTS_EDIT
  ),
  { requiresAuth: true }
);
