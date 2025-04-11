/**
 * Register API Route
 * Handles user registrations directly using the database
 */
import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { formatResponse } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getPrismaClient } from '@/infrastructure/common/database/prisma';
import { UserRole } from '@/domain/enums/UserEnums';

/**
 * POST /api/auth/register
 * Processes registration requests and creates new user accounts
 */
export async function POST(req: NextRequest) {
  const logger = getLogger();
  const prisma = getPrismaClient();
  
  try {
    // Parse request body
    const data = await req.json();
    
    // Basic validation
    if (!data.name || !data.email || !data.password || !data.confirmPassword) {
      return NextResponse.json(
        formatResponse.validationError(
          ['All fields are required'],
          'Validation failed'
        ),
        { status: 400 }
      );
    }
    
    if (data.password !== data.confirmPassword) {
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
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        formatResponse.validationError(
          ['Email address is already in use'],
          'Validation failed'
        ),
        { status: 400 }
      );
    }
    
    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(data.password, salt);
    
    // Get IP address for audit logs
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: UserRole.USER, // Default role for new users
        status: 'ACTIVE', // By default, users are active
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Log the registration
    await prisma.userActivity.create({
      data: {
        activity: 'USER_REGISTERED',
        userId: newUser.id,
        details: JSON.stringify({ ipAddress }),
        timestamp: new Date()
      }
    });
    
    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;
    
    logger.info('User registered successfully', { userId: newUser.id, email: data.email });
    
    // Success response
    return NextResponse.json(
      formatResponse.success(
        userWithoutPassword,
        'Registration successful. You can now log in.'
      ),
      { status: 201 }
    );
  } catch (error) {
    logger.error('Registration error:',  { error });
    
    // Error handling for duplicate email addresses
    if (error instanceof Error && error.message.includes('unique constraint')) {
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
  } finally {
    // No need to disconnect when using the singleton pattern
    // The connection pool is managed by the prisma client
  }
}
