import { NextResponse, NextRequest } from 'next/server';
import { apiAuth } from '@/features/auth/api/middleware';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { IRequestService } from '@/domain/services/IRequestService';
import { CreateRequestRequest } from '../models/request-request-models';

/**
 * POST handler for creating a request
 * @param request - Next.js request object
 * @returns Response with created request
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await apiAuth(request);
    if (!session) {
      return formatResponse.error('Authentication required', 401);
    }
    
    // Check if user is authenticated
    if (!session.user) {
      return formatResponse.error('User not authenticated', 401);
    }
    
    // Access user info from either session or req.auth
    // req.auth is added by apiAuth() to maintain backward compatibility
    const userId = (request as any).auth?.userId || session.user.id;
    const userRole = (request as any).auth?.role || session.user.role || 'user';

    // Parse request body
    const data: CreateRequestRequest = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.service) {
      return formatResponse.error('Missing required fields: name, email, and service are required', 400);
    }

    // Get request service
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();

    // Convert string source to RequestSource enum if needed
    const requestData = {
      ...data,
      // Convert string source to RequestSource if it exists
      source: data.source ? (data.source as any) : undefined
    };

    // User ID and role are already obtained from the auth session above
    
    // Create request
    const result = await requestService.createRequest(requestData, {
      context: {
        userId,
        role: userRole
      }
    });

    // Return formatted response
    return formatResponse.success(result, 'Request created successfully', 201);
  } catch (error) {
    return formatResponse.error('An error occurred while creating the request', 500);
  }
}
