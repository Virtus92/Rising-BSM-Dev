import { Express } from 'express';
import request from 'supertest';
import { DbHelper } from './db-helper.js';
import { PrismaClient } from '@prisma/client';

/**
 * Helper for auth-related test operations
 */
export class AuthHelper {
  /**
   * Login a user and get tokens
   * 
   * @param app - Express app
   * @param email - User email
   * @param password - User password
   * @returns Login response with tokens
   */
  static async loginUser(
    app: Express,
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: number;
  }> {
    const response = await request(app)
      .post('/API/v1/login')
      .send({
        email,
        password
      });
      
    if (response.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
    }
    
    return {
      accessToken: response.body.data.accessToken,
      refreshToken: response.body.data.refreshToken,
      userId: response.body.data.user.id
    };
  }
  
  /**
   * Create a test user and log them in
   * 
   * @param app - Express app
   * @param prisma - PrismaClient
   * @param options - User options
   * @returns User and tokens
   */
  static async createAndLoginUser(
    app: Express,
    options: {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      status?: string;
    } = {}
  ): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }> {
    const password = options.password || 'Password123!';
    const user = await DbHelper.createTestUser({
      ...options,
      password
    });
    
    const { accessToken, refreshToken } = await AuthHelper.loginUser(
      app,
      user.email,
      password
    );
    
    return {
      user,
      accessToken,
      refreshToken
    };
  }
  
  /**
   * Create test users with different roles
   * 
   * @returns Created users
   */
  static async createTestUsers(
    app: Express
  ): Promise<{
    admin: { user: any; accessToken: string; refreshToken: string };
    manager: { user: any; accessToken: string; refreshToken: string };
    employee: { user: any; accessToken: string; refreshToken: string };
    regularUser: { user: any; accessToken: string; refreshToken: string };
  }> {
    const admin = await AuthHelper.createAndLoginUser(app, {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin1234!',
      role: 'admin'
    });
    
    const manager = await AuthHelper.createAndLoginUser(app, {
      name: 'Manager User',
      email: 'manager@example.com',
      password: 'Manager1234!',
      role: 'manager'
    });
    
    const employee = await AuthHelper.createAndLoginUser(app, {
      name: 'Employee User',
      email: 'employee@example.com',
      password: 'Employee1234!',
      role: 'mitarbeiter'
    });
    
    const regularUser = await AuthHelper.createAndLoginUser(app, {
      name: 'Regular User',
      email: 'user@example.com',
      password: 'User1234!',
      role: 'benutzer'
    });
    
    return {
      admin,
      manager,
      employee,
      regularUser
    };
  }
}

export default AuthHelper;