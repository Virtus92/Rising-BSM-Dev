import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository.js';
import { QueryBuilder } from '../utils/query-builder.js';
import { UserFilterDTO } from '../types/dtos/user.dto.js';
import { UserRecord } from '../types/models.js';
import { prisma } from '../utils/prisma.utils.js';
import entityLogger from '../utils/entity-logger.js';

/**
 * User entity type
 */
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string | null;
  status: string;
  profilePicture?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository extends BaseRepository<UserRecord, UserFilterDTO> {
  constructor() {
    super(prisma, prisma.user);
  }
  
  protected buildFilterConditions(filters: UserFilterDTO): any {
    const { status, search, role } = filters;
    
    const builder = new QueryBuilder();
    
    if (status) {
      builder.addFilter('status', status);
    }
    
    if (role) {
      builder.addFilter('role', role);
    }
    
    if (search) {
      builder.addSearch(search, ['name', 'email']);
    }
    
    return builder.build();
  }
  
  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.model.findUnique({
      where: { email }
    });
  }
  
  async createPasswordResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    await this.model.update({
      where: { id: userId },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry
      }
    });
  }
  
  async findByResetToken(token: string): Promise<UserRecord | null> {
    return this.model.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });
  }
  
  async clearResetToken(userId: number): Promise<void> {
    await this.model.update({
      where: { id: userId },
      data: {
        resetToken: null,
        resetTokenExpiry: null
      }
    });
  }
  
  async getUserSettings(userId: number): Promise<any> {
    return this.prisma.userSettings.findUnique({
      where: { userId }
    });
  }
  
  async updateUserSettings(userId: number, settings: any): Promise<any> {
    // Check if settings exist
    const existing = await this.prisma.userSettings.findUnique({
      where: { userId }
    });
    
    if (!existing) {
      // Create new settings
      return this.prisma.userSettings.create({
        data: {
          userId,
          ...settings
        }
      });
    } else {
      // Update existing settings
      return this.prisma.userSettings.update({
        where: { userId },
        data: {
          ...settings,
          updatedAt: new Date()
        }
      });
    }
  }
  
  async getUserActivity(userId: number, limit: number = 5): Promise<any[]> {
    return this.prisma.userActivity.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }
  
  /**
   * Log activity for a user
   * @param userId - User ID
   * @param actorId - Actor user ID
   * @param actorName - Actor user name
   * @param action - Action type
   * @param details - Additional details
   * @returns Created log
   */
  async logActivity(
    userId: number,
    actorId: number,
    actorName: string,
    action: string,
    details?: string
  ): Promise<any> {
    return entityLogger.createLog('user', userId, actorId, actorName, action, details);
  }

  /**
   * Log user activity (simplified version)
   * @param userId - User ID
   * @param activity - Activity type
   * @param ipAddress - IP address
   * @returns Created activity log
   */
  async logSimpleActivity(
    userId: number,
    activity: string,
    ipAddress: string | null = null
  ): Promise<any> {
    return this.prisma.userActivity.create({
      data: {
        userId,
        activity,
        ipAddress,
        timestamp: new Date()
      }
    });
  }
}

export const userRepository = new UserRepository();
export default userRepository;