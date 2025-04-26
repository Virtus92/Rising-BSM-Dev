import { NextResponse } from 'next/server';
import { apiAuth } from '@/features/auth/api/middleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getServiceFactory } from '@/core/factories';
import { IRequestService } from '@/domain/services/IRequestService';
import { CreateRequestRequest } from '../models/request-request-models';

/**
 * POST handler for creating a request
 * @param request - Next.js request object
 * @returns Response with created request
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const auth = await apiAuth.auth(request);
    if (!auth.success) {
      return formatResponse.error(auth.message || 'Authentication required', auth.status || 401);
    }

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

    // Import proper auth middleware and get user details from JWT token
    const { extractAuthToken } = await import('@/features/auth/api/middleware/authMiddleware');
    const token = extractAuthToken(request);
    let userId = 0;
    let userRole = 'user';
    
    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, jwtSecret) as any;
        userId = Number(decoded.sub) || 0;
        userRole = decoded.role || 'user';
      } catch (e) {
        // Continue with defaults if token decoding fails
      }
    }
    
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
