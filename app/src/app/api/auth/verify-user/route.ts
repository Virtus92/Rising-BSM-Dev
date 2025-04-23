import { NextResponse } from 'next/server';
import { db } from '@/infrastructure/db';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * API endpoint for user verification
 * This is called by the middleware to verify if a user exists and is active
 * Returns minimal user info to avoid exposing sensitive data
 */
export async function POST(request: Request) {
  const logger = getLogger();
  
  try {
    const { userId, token } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required'
      }, { status: 400 });
    }
    
    // Query the database for the user
    const user = await db.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        role: true,
        status: true,
        email: true,
      }
    });
    
    // If user not found, return 404
    if (!user) {
      logger.warn(`User not found in verify-user endpoint: ${userId}`);
      return NextResponse.json({ 
        success: false, 
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      logger.warn(`Inactive user attempted access: ${userId}, status: ${user.status}`);
      return NextResponse.json({ 
        success: false, 
        message: 'User account is not active',
        status: user.status
      }, { status: 403 });
    }
    
    // Return minimal user info to keep response size small
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    logger.error('Error in verify-user endpoint:', { error });
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error'
    }, { status: 500 });
  }
}
