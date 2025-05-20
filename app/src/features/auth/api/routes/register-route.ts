/**
 * Register API Route Handler
 * Handles user registrations through the auth service
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';

/**
 * Registration handler for POST /api/auth/register
 * Processes registration requests and creates new user accounts
 */
export async function registerHandler(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get the auth service
    const authService = serviceFactory.createAuthService();
    
    // Parse request body
    const data = await req.json();
    
    // Basic validation - check all possible field names for password confirmation
    const passwordConfirm = data.confirmPassword || data.passwordConfirm;
    
    if (!data.name || !data.email || !data.password || !passwordConfirm) {
      return NextResponse.json(
        formatResponse.validationError(
          ['All fields are required'],
          'Validation failed'
        ),
        { status: 400 }
      );
    }
    
    if (data.password !== passwordConfirm) {
      return NextResponse.json(
        formatResponse.validationError(
          ['Passwords do not match'],
          'Validation failed'
        ),
        { status: 400 }
      );
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        formatResponse.validationError(
          ['Invalid email format'],
          'Validation failed'
        ),
        { status: 400 }
      );
    }
    
    // Password strength validation
    if (data.password.length < 8) {
      return NextResponse.json(
        formatResponse.validationError(
          ['Password must be at least 8 characters long'],
          'Validation failed'
        ),
        { status: 400 }
      );
    }
    
    // Get IP address for audit
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Terms agreement validation - check both possible field names
    if (!data.terms && !data.acceptTerms) {
      return NextResponse.json(
        formatResponse.validationError(
          ['You must accept the terms and conditions'],
          'Validation failed'
        ),
        { status: 400 }
      );
    }
    
    // Normalize the terms field
    data.terms = data.terms || data.acceptTerms;
    
    // Register the user using auth service
    const result = await authService.register(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        terms: data.terms === true,
        phone: data.phone
      },
      {
        context: {
          ipAddress,
          userAgent: req.headers.get('user-agent') || 'unknown'
        }
      }
    );
    
    if (!result.success) {
      return NextResponse.json(
        formatResponse.error(result.message || 'Registration failed', 400),
        { status: 400 }
      );
    }
    
    logger.info('User registered successfully', { email: data.email });
    
    // Success response
    return NextResponse.json(
      formatResponse.success(
        result.data,
        'Registration successful. You can now log in.'
      ),
      { status: 201 }
    );
  } catch (error) {
    logger.error('Registration error:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Error handling for duplicate email addresses
    if (error instanceof Error && (
      error.message.includes('unique constraint') || 
      error.message.includes('already in use') ||
      error.message.includes('duplicate')
    )) {
      return NextResponse.json(
        formatResponse.validationError(
          ['Email address is already in use'],
          'Validation failed'
        ),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      formatResponse.error(error instanceof Error ? error.message : 'An error occurred during registration', 500),
      { status: 500 }
    );
  }
}
