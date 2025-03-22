import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository';
import { QueryBuilder } from '../utils/query-builder';
import { FilterOptions } from '../types/controller-types';
import { UserRecord } from '../types/models';
import { prisma } from '../utils/prisma.utils';

export class UserRepository extends BaseRepository<UserRecord> {
  constructor() {
    super(prisma, prisma.user);
  }
  
  protected buildFilterConditions(filters: FilterOptions): any {
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
  
  async logActivity(userId: number, activity: string, ipAddress?: string): Promise<void> {
    await this.prisma.userActivity.create({
      data: {
        userId,
        activity,
        ipAddress: ipAddress || null,
        timestamp: new Date()
      }
    });
  }
}
