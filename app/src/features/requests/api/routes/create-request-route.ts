import { NextResponse, NextRequest } from 'next/server';
import { apiAuth } from '@/features/auth/api/middleware';
import { formatResponse } from '@/core/errors';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { IRequestService } from '@/domain/services/IRequestService';
import { CreateRequestRequest } from '../models/request-request-models';
import { RequestSource } from '@/domain/dtos/RequestDtos';

/**
 * POST handler for creating a request
 * @param request - Next.js request object
 * @returns Response with created request
 */
export const POST = apiAuth(
  async (request: NextRequest, user: any) => {
    try {
      // User is already authenticated by apiAuth middleware
      const userId = user?.id;
      const userRole = user?.role || 'user';

      // Parse request body
      const data: CreateRequestRequest = await request.json();

      // Validate required fields
      if (!data.name || !data.email || !data.service) {
        return formatResponse.error('Missing required fields: name, email, and service are required', 400);
      }

      // Get request service
      const serviceFactory = getServiceFactory();
      const requestService = serviceFactory.createRequestService();

      // Ensure source is a valid RequestSource type
      
      // Valid RequestSource values for validation
      const validSources: RequestSource[] = [
        'human', 'chatbot', 'call-agent', 'email', 'form', 'api'
      ];
      
      // Convert string source to RequestSource type
      const requestData = {
        ...data,
        // Validate source is a valid RequestSource value
        source: data.source && typeof data.source === 'string' && 
                validSources.includes(data.source as RequestSource) 
                ? (data.source as RequestSource) 
                : undefined
      };
      
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
);