/**
 * User Verification API Route Handler
 * 
 * Verifies if a user exists and is active
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';

/**
 * Handles user verification requests
 */
export async function verifyUserHandler(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  
  try {
    const { userId, token } = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required',
        errorCode: 'missing_parameter',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    logger.debug(`Processing verification request for user ID: ${userId}`);
    
    // Get the user service
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Get the user by ID
    const user = await userService.getById(Number(userId));
    
    // If user not found, return 404
    if (!user) {
      logger.warn(`User not found in verify-user endpoint: ${userId}`);
      return NextResponse.json({
        success: false,
        message: 'User not found',
        errorCode: 'not_found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }
    
    logger.debug(`User ${userId} retrieved for verification: ${JSON.stringify({
      id: user.id,
      status: user.status,
      role: user.role
    })}`);
    
    // Check if user is active
    if (user.status !== 'active') {
      logger.warn(`Inactive user attempted access: ${userId}, status: ${user.status}`);
      return NextResponse.json({
        success: false,
        message: 'User account is not active',
        errorCode: 'inactive_account',
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }
    
    // For user ID 3 (the problematic user), log extensive details
    if (userId === '3') {
      logger.debug(`Special debug for user 3: Status check passed, status value: "${user.status}"`);
    }
    
    // Create the response structure correctly
    // Do NOT use formatResponse.success() as it returns NextResponse directly
    // We need to create our own response object structure
    const responseData = {
      success: true,
      message: 'User verified successfully',
      data: {
        user: {
          id: user.id,
          role: user.role,
          status: user.status
        }
      },
      timestamp: new Date().toISOString()
    };
    
    // Log the exact response we're sending to help debug middleware issues
    logger.debug(`Sending verification response for user ${userId}:`, {
      success: responseData.success,
      statusCode: 200,
      responseData: JSON.stringify(responseData)
    });
    
    // Return the response with NextResponse.json()
    return NextResponse.json(responseData);
  } catch (error) {
    const errorInfo = error instanceof Error ? 
      { message: error.message, stack: error.stack } : 
      { message: String(error) };
      
    // Create standardized error response
    const errorResponse = {
      success: false,
      message: `Internal server error: ${errorInfo.message}`,
      errorCode: 'server_error',
      timestamp: new Date().toISOString()
    };
      
    logger.error('Error in verify-user endpoint:', errorInfo);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
