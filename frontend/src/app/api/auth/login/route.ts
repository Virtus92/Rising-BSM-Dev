import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '@/infrastructure/common/database/prisma';
import { getLogger } from '@/infrastructure/common/logging';
import { securityConfig } from '@/infrastructure/common/config/SecurityConfig';

// Note: We removed the rate limiting for now to simplify debugging
export async function POST(request: NextRequest) {
  const logger = getLogger();
  const prisma = getPrismaClient();

  try {
    const data = await request.json();
    const { email, password, remember = false } = data;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      logger.info('Login failed: User not found', { email });
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
      logger.info('Login failed: User account not active', { email, status: user.status });
      return NextResponse.json(
        { success: false, message: 'Account is not active. Please contact admin.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.info('Login failed: Invalid credentials', { email });
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    // Use the security config but with a fallback for JWT_SECRET
    const secret = process.env.JWT_SECRET || 'default-secret-change-me';
    
    // Get token lifetime (simplified for backward compatibility)
    const accessExpires = 24 * 60 * 60; // 24 hours in seconds
    const refreshExpires = 30 * 24 * 60 * 60; // 30 days in seconds
    
    // Create payload with both old structure and new fields
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      // Add new fields for enhanced security (for new tokens)
      iss: 'rising-bsm',
      aud: 'rising-bsm-app',
      jti: require('crypto').randomBytes(8).toString('hex')
    };
    
    // Generate tokens
    const accessToken = jwt.sign(payload, secret, { expiresIn: '24h' });
    const refreshToken = require('crypto').randomBytes(40).toString('hex');
    
    // Store refresh token in database
    try {
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + refreshExpires * 1000),
          createdByIp: request.headers.get('x-forwarded-for') || 'unknown'
        }
      });
    } catch (dbError) {
      logger.error('Failed to store refresh token', { error: dbError });
      // Continue even if this fails - user can still log in
    }
    
    // Update user's last login time
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    } catch (updateError) {
      logger.error('Failed to update last login time', { error: updateError });
      // Continue - not critical
    }
    
    // Log successful login
    logger.info('User logged in successfully', { userId: user.id });
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        // Include tokens in response body for client-side storage backup
        accessToken,
        refreshToken
      }
    });
    
    // Set HTTP-only cookies with proper settings
    response.cookies.set({
      name: 'auth_token',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed to lax to allow cross-site requests during login redirects
      path: '/',
      maxAge: accessExpires // 24 hours in seconds
    });
    
    response.cookies.set({
      name: 'refresh_token',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed to lax to allow cross-site requests
      path: '/',
      maxAge: refreshExpires // 30 days in seconds
    });
    
    // Add debugging headers
    response.headers.set('X-Token-Set', 'true');
    response.headers.set('X-Auth-User-ID', user.id.toString());
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    // Log the response for debugging
    console.log(`Login response prepared for user ID: ${user.id} - token length: ${accessToken.length}`);
    
    return response;
  } catch (error) {
    logger.error('Login error:', { error });
    console.error('Login error details:', error);
    
    return NextResponse.json(
      { success: false, message: 'An error occurred during login', details: JSON.stringify(error) },
      { status: 500 }
    );
  }
}
