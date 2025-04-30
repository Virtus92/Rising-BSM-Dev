import { NextResponse, NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/route-handler';
import { apiAuth } from '@/features/auth/api/middleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { IRequestService } from '@/domain/services/IRequestService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * POST handler for creating an appointment from a request
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with created appointment
 */
export const POST = routeHandler(async (request: NextRequest) => {
  // Extract ID from URL path segments
  const urlParts = request.nextUrl.pathname.split('/');
  const id = Number(urlParts[urlParts.length - 2]); // Take the second-to-last segment (the [id] part)
  try {
    if (isNaN(id) || id <= 0) {
      return formatResponse.error('Invalid request ID', 400);
    }

    // Authenticate user
    const auth = await apiAuth(request);
    if (!auth) {
      return formatResponse.error('Authentication required', 401);
    }

    // Verify permissions
    const permissionCheck = await permissionMiddleware.checkPermission(request, [SystemPermission.APPOINTMENTS_CREATE]);
    if (!permissionCheck.success) {
      return formatResponse.error(permissionCheck.message || 'Permission denied', permissionCheck.status || 403);
    }

    // Parse request body
    const data = await request.json();

    // Validate appointment date
    if (!data.appointmentDate) {
      return formatResponse.error('Appointment date is required', 400);
    }

    // Get request service
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();

    // Import proper auth middleware and get user details from JWT token
    const { extractAuthToken } = await import('@/features/auth/api/middleware/authMiddleware');
    const token = await extractAuthToken(request);
    let userId = 0;
    
    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, jwtSecret) as any;
        userId = Number(decoded.sub) || 0;
      } catch (e) {
        // Continue with defaults if token decoding fails
      }
    }
    
    // Create appointment
    const result = await requestService.createAppointmentForRequest(
      id,
      {
        title: data.title,
        appointmentDate: new Date(data.appointmentDate),
        duration: data.duration || 60,
        location: data.location,
        description: data.description
      },
      data.note,
      {
        context: {
          userId
        }
      }
    );

    // Return formatted response
    return formatResponse.success(result, 'Appointment created successfully', 201);
  } catch (error) {
    return formatResponse.error('An error occurred while creating the appointment', 500);
  }
});

