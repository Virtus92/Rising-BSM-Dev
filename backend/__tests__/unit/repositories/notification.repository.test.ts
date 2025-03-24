/**
 * Notification Repository Tests
 * 
 * Unit tests for the notification repository.
 */
import { NotificationRepository } from '../../../repositories/notification.repository';
import { NotificationType } from '../../../types/dtos/notification.dto';
import { setupRepositoryTest } from '../utils/prisma-test.utils';
import { PrismaClient, Notification } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let prisma: DeepMockProxy<PrismaClient>;
  
  // Sample notification for testing
  const sampleNotification: Notification = {
    id: 1,
    userId: 1,
    type: NotificationType.INFO,
    title: 'Test Title',
    message: 'Test Message',
    description: null,
    read: false,
    referenceId: null,
    referenceType: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  beforeEach(() => {
    // Setup Prisma mock using our test utilities
    prisma = setupRepositoryTest<Notification>('notification', sampleNotification);
    
    // Instantiate repository with mock PrismaClient
    repository = new NotificationRepository(prisma);
    
    // Add specific mock implementations for this test suite
    prisma.notification.groupBy.mockResolvedValue([
      { type: NotificationType.INFO, _count: { type: 2 } as any },
      { type: NotificationType.REQUEST, _count: { type: 1 } as any }
    ] as any);
  });

  describe('buildFilterConditions', () => {
    it('should build filter conditions with userId', () => {
      // Act
      const result = (repository as any).buildFilterConditions({ userId: 1 });
      
      // Assert
      expect(result).toEqual({ userId: 1 });
    });
    
    it('should build filter conditions with type', () => {
      // Act
      const result = (repository as any).buildFilterConditions({ type: NotificationType.INFO });
      
      // Assert
      expect(result).toEqual({ type: NotificationType.INFO });
    });
    
    it('should build filter conditions with read status as boolean', () => {
      // Act
      const result = (repository as any).buildFilterConditions({ read: true });
      
      // Assert
      expect(result).toEqual({ read: true });
    });
    
    it('should build filter conditions with read status as string', () => {
      // Act
      const result = (repository as any).buildFilterConditions({ read: 'true' });
      
      // Assert
      expect(result).toEqual({ read: true });
    });
    
    it('should build filter conditions with search term', () => {
      // Act
      const result = (repository as any).buildFilterConditions({ search: 'test' });
      
      // Assert
      expect(result).toEqual({
        OR: [
          { title: { contains: 'test', mode: 'insensitive' } },
          { message: { contains: 'test', mode: 'insensitive' } }
        ]
      });
    });
    
    it('should combine multiple filter conditions', () => {
      // Act
      const result = (repository as any).buildFilterConditions({
        userId: 1,
        type: NotificationType.INFO,
        read: false,
        search: 'test'
      });
      
      // Assert
      expect(result).toEqual(expect.objectContaining({
        userId: 1,
        type: NotificationType.INFO,
        read: false,
        OR: expect.any(Array)
      }));
    });
  });
  
  describe('markAsRead', () => {
    it('should mark all user notifications as read', async () => {
      // Act
      const result = await repository.markAsRead(1);
      
      // Assert
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, read: false },
        data: { read: true }
      });
      expect(result).toBe(1);
    });
    
    it('should mark specific notification as read', async () => {
      // Act
      const result = await repository.markAsRead(1, 5);
      
      // Assert
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, id: 5, read: false },
        data: { read: true }
      });
      expect(result).toBe(1);
    });
    
    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.notification.updateMany.mockRejectedValueOnce(error);
      
      // Act & Assert
      await expect(repository.markAsRead(1)).rejects.toThrow(error);
    });
  });
  
  describe('createBulk', () => {
    it('should create multiple notifications in a transaction', async () => {
      // Arrange
      const notificationData = [
        {
          userId: 1,
          title: 'Notification 1',
          message: 'Message 1',
          type: NotificationType.INFO
        },
        {
          userId: 2,
          title: 'Notification 2',
          message: 'Message 2',
          type: NotificationType.INFO
        }
      ];
      
      // Mock create to return different notifications based on input
      prisma.notification.create.mockImplementation((params: any) => {
        return Promise.resolve({
          ...sampleNotification,
          id: params.data.userId === 1 ? 1 : 2,
          userId: params.data.userId,
          title: params.data.title,
          message: params.data.message
        }) as any;
      });
      
      // Act
      const result = await repository.createBulk(notificationData);
      
      // Assert
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(1);
      expect(result[1].userId).toBe(2);
    });
    
    it('should handle errors in transaction', async () => {
      // Arrange
      const error = new Error('Transaction error');
      prisma.$transaction.mockRejectedValueOnce(error);
      
      // Act & Assert
      await expect(repository.createBulk([
        {
          userId: 1,
          title: 'Test',
          message: 'Test',
          type: NotificationType.INFO
        }
      ])).rejects.toThrow(error);
    });
  });
  
  describe('getCountsByType', () => {
    it('should get notification counts by type', async () => {
      // Act
      const result = await repository.getCountsByType(1);
      
      // Assert
      expect(prisma.notification.groupBy).toHaveBeenCalledWith({
        by: ['type'],
        where: { userId: 1 },
        _count: { type: true }
      });
      expect(result).toEqual([
        { type: NotificationType.INFO, count: 2 },
        { type: NotificationType.REQUEST, count: 1 }
      ]);
    });
    
    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.notification.groupBy.mockRejectedValueOnce(error);
      
      // Act & Assert
      await expect(repository.getCountsByType(1)).rejects.toThrow(error);
    });
  });
  
  describe('deleteAllRead', () => {
    it('should delete all read notifications for a user', async () => {
      // Act
      const result = await repository.deleteAllRead(1);
      
      // Assert
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1, read: true }
      });
      expect(result).toBe(1);
    });
    
    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.notification.deleteMany.mockRejectedValueOnce(error);
      
      // Act & Assert
      await expect(repository.deleteAllRead(1)).rejects.toThrow(error);
    });
  });
  
  describe('deleteOld', () => {
    it('should delete notifications older than specified date', async () => {
      // Arrange
      const olderThan = new Date('2023-01-01');
      
      // Act
      const result = await repository.deleteOld(1, olderThan, true);
      
      // Assert
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          createdAt: { lt: olderThan },
          read: true
        }
      });
      expect(result).toBe(1);
    });
    
    it('should delete all old notifications when onlyRead is false', async () => {
      // Arrange
      const olderThan = new Date('2023-01-01');
      
      // Act
      const result = await repository.deleteOld(1, olderThan, false);
      
      // Assert
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          createdAt: { lt: olderThan }
        }
      });
      expect(result).toBe(1);
    });
    
    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.notification.deleteMany.mockRejectedValueOnce(error);
      
      // Act & Assert
      await expect(repository.deleteOld(1, new Date())).rejects.toThrow(error);
    });
  });
  
  describe('inherited BaseRepository methods', () => {
    it('should find all notifications with filters', async () => {
      // Arrange
      prisma.notification.findMany.mockResolvedValueOnce([sampleNotification]);
      prisma.notification.count.mockResolvedValueOnce(1);
      
      // Act
      const result = await repository.findAll({ userId: 1 }, { page: 1, limit: 10 });
      
      // Assert
      expect(prisma.notification.findMany).toHaveBeenCalled();
      expect(prisma.notification.count).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual(expect.objectContaining({
        current: 1,
        limit: 10,
        total: 1
      }));
    });
    
    it('should find notification by ID', async () => {
      // Act
      const result = await repository.findById(1);
      
      // Assert
      expect(prisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: undefined,
        select: undefined
      });
      expect(result).toEqual(sampleNotification);
    });
    
    it('should delete notification', async () => {
      // Act
      const result = await repository.delete(1);
      
      // Assert
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(result).toEqual(sampleNotification);
    });
  });
});