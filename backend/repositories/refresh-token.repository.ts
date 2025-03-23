import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository.js';
import { QueryBuilder } from '../utils/query-builder.js';
import { FilterOptions } from '../types/controller.types.js';
import { prisma } from '../utils/prisma.utils.js';

export class RefreshTokenRepository extends BaseRepository<any> {
  constructor() {
    super(prisma, prisma.refreshToken);
  }
  
  protected buildFilterConditions(filters: FilterOptions): any {
    const { userId, revoked } = filters;
    
    const builder = new QueryBuilder();
    
    if (userId) {
      builder.addFilter('userId', Number(userId));
    }
    
    if (revoked !== undefined) {
      builder.addFilter('revoked', revoked === 'true' || revoked === true);
    }
    
    return builder.build();
  }
  
  async findValidToken(token: string): Promise<any> {
    return this.model.findFirst({
      where: {
        token,
        revoked: false,
        expires: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        }
      }
    });
  }
  
  async revokeToken(id: number, ipAddress?: string): Promise<any> {
    return this.model.update({
      where: { id },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedByIp: ipAddress
      }
    });
  }
  
  async revokeAllUserTokens(userId: number): Promise<number> {
    const result = await this.model.updateMany({
      where: {
        userId,
        revoked: false
      },
      data: {
        revoked: true,
        revokedAt: new Date()
      }
    });
    
    return result.count;
  }
  
  async replaceToken(oldToken: string, newToken: string, expires: Date, ipAddress?: string): Promise<any> {
    const existingToken = await this.model.findFirst({
      where: {
        token: oldToken,
        revoked: false
      }
    });
    
    if (!existingToken) {
      return null;
    }
    
    // Revoke old token and create new one
    await this.revokeToken(existingToken.id, ipAddress);
    
    return this.model.create({
      data: {
        token: newToken,
        userId: existingToken.userId,
        expires,
        createdByIp: ipAddress,
        tokenFamily: existingToken.tokenFamily
      }
    });
  }
  
  async deleteExpiredTokens(): Promise<number> {
    const result = await this.model.deleteMany({
      where: {
        OR: [
          { expires: { lt: new Date() } },
          {
            revoked: true,
            revokedAt: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
            }
          }
        ]
      }
    });
    
    return result.count;
  }
}
