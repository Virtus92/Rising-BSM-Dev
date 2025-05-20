/**
 * Role Defaults API Route
 * 
 * This file handles getting and setting default permissions for a specific role
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getLogger } from '@/core/logging';
import { UserRole } from '@/domain/enums/UserEnums';

// Force Node.js runtime for this route
export const runtime = 'nodejs';

const logger = getLogger();

/**
 * GET /api/permissions/role-defaults/[role]
 * Get default permissions for a specific role
 */
export const GET = async (request: NextRequest) => {
  // Use URL path to extract role parameter - avoids the type issue with params
  const urlParts = request.nextUrl.pathname.split('/');
  const role = urlParts[urlParts.length - 1];
  
  // Log request details for debugging
  logger.debug(`Role permissions request received`, {
    requestId: `role-perms-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role
  });
  
  if (!role) {
    return formatResponse.error('Role parameter is required', 400);
  }
  
  try {
    // Validate role parameter
    const normalizedRole = role.toLowerCase();
    const validRoles = Object.values(UserRole).map(r => r.toLowerCase());
    
    if (!validRoles.includes(normalizedRole)) {
      return formatResponse.error(
        `Invalid role: ${role}. Valid roles are: ${Object.values(UserRole).join(', ')}`,
        400
      );
    }
    
    // Get service factory and create permission service
    const serviceFactory = getServiceFactory();
    const permissionService = serviceFactory.createPermissionService();
    
    // Get default permissions for the role with proper error handling
    try {
      // Log request to help with debugging
      logger.info(`Retrieving default permissions for role: ${normalizedRole}`);
      
      const permissions = await permissionService.getDefaultPermissionsForRole(normalizedRole);
      
      // Return success response with database permissions
      logger.info(`Retrieved ${permissions.length} permissions for role: ${normalizedRole}`);
      return formatResponse.success(
        { role: normalizedRole, permissions },
        `Retrieved default permissions for role: ${normalizedRole}`
      );
    } catch (serviceError) {
      logger.error('Error getting default permissions from service', {
        error: serviceError instanceof Error ? serviceError.message : String(serviceError),
        stack: serviceError instanceof Error ? serviceError.stack : undefined,
        role: normalizedRole
      });
      
      // Return proper error response
      return formatResponse.error(
        `Failed to get role permissions: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}`,
        500
      );
    }
  } catch (error) {
    logger.error('Error fetching role defaults', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      role
    });
    
    return formatResponse.error(
      `Error retrieving default permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
};

/**
 * POST /api/permissions/role-defaults/[role]
 * Update default permissions for a specific role
 */
export const POST = async (request: NextRequest) => {
  // Use URL path to extract role parameter - avoids the type issue with params
  const urlParts = request.nextUrl.pathname.split('/');
  const role = urlParts[urlParts.length - 1];
  
  // Use auth middleware to get authenticated user
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return formatResponse.unauthorized('Authentication required');
  }
  
  // Extract token
  const token = authHeader.substring(7);
  
  try {
    // Verify token
    const jwt = require('jsonwebtoken');
    const { securityConfig } = require('@/core/config/SecurityConfig');
    
    const jwtSecret = securityConfig.getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret);
    
    if (!decoded || !decoded.sub) {
      return formatResponse.unauthorized('Invalid token');
    }
    
    const userId = typeof decoded.sub === 'number' ? decoded.sub : parseInt(decoded.sub, 10);
    
    // Check permission
    const serviceFactory = getServiceFactory();
    const permissionService = serviceFactory.createPermissionService();
    
    const hasPermission = await permissionService.hasPermission(
      userId, 
      SystemPermission.PERMISSIONS_MANAGE
    );
    
    if (!hasPermission) {
      return formatResponse.forbidden(
        `Insufficient permissions: ${SystemPermission.PERMISSIONS_MANAGE}`
      );
    }
    
    if (!role) {
      return formatResponse.error('Role parameter is required', 400);
    }

    // Normalize role name to lowercase for consistency
    const normalizedRole = role.toLowerCase();
    
    // Check if role is valid
    const validRoles = Object.values(UserRole).map(r => r.toLowerCase());
    if (!validRoles.includes(normalizedRole)) {
      return formatResponse.error(
        `Invalid role: ${role}. Valid roles are: ${Object.values(UserRole).join(', ')}`,
        400
      );
    }

    // Parse request body
    const requestData = await request.json();
    
    // Validate request data
    if (!requestData || !Array.isArray(requestData.permissions)) {
      return formatResponse.error('Invalid request format. Expected { permissions: string[] }', 400);
    }

    // Update default permissions for the role
    const result = await permissionService.setDefaultPermissionsForRole(
      normalizedRole, 
      requestData.permissions,
      { userId }
    );
    
    // Return success response
    return formatResponse.success(
      {
        role: normalizedRole,
        permissions: result
      },
      `Default permissions updated successfully for role: ${normalizedRole}`
    );
  } catch (error) {
    // Log the error with context
    logger.error('Error updating default permissions for role', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      role: role
    });
    
    // Return error response
    return formatResponse.error(
      `Error updating permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
};
