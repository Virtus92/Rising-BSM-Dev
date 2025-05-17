'use client';

/**
 * Registration functionality
 * 
 * This module provides user registration functionality 
 * for the authentication system.
 */
import { ApiClient } from '@/core/api/ApiClient';
import { getLogger } from '@/core/logging';

const logger = getLogger();

// Type definition for registration data
export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

/**
 * Register a new user
 * 
 * @param data Registration data
 * @returns Success status and message
 */
export async function register(data: RegisterData): Promise<{ success: boolean; message?: string }> {
  try {
    // Call registration API
    const response = await ApiClient.post('/api/auth/register', data);
    
    if (!response.success) {
      return {
        success: false,
        message: response.message || 'Registration failed'
      };
    }
    
    return {
      success: true,
      message: 'Registration successful'
    };
  } catch (error) {
    logger.error('Error during registration:', error as Error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Registration error'
    };
  }
}
