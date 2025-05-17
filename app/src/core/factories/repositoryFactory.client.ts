'use client';

/**
 * Client-side repository factory
 * This provides mock repositories that use API clients instead of direct database access
 */
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/bootstrap';

// Client-side repository implementations
// These should use API clients instead of direct database access
import { NotificationRepository } from '@/features/notifications/lib/repositories/NotificationRepository';

// Interface imports
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { IRefreshTokenRepository } from '@/domain/repositories/IRefreshTokenRepository';
import { IActivityLogRepository } from '@/domain/repositories/IActivityLogRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { IPermissionRepository } from '@/domain/repositories/IPermissionRepository';
import { IRequestDataRepository } from '@/domain/repositories/IRequestDataRepository';

// Singleton instances for client repositories
let notificationRepository: NotificationRepository | null = null;

/**
 * Creates a mock repository that works in client context
 * This is used when we need to satisfy the interface but don't need actual implementation
 */
function createMockRepository(name: string) {
  const logger = getLogger();
  
  return {
    findById: async () => {
      logger.warn(`Client-side mock repository ${name} used. This is expected in client components.`);
      return null;
    },
    findAll: async () => ({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
    create: async () => { throw new Error('Cannot use direct database access in client components'); },
    update: async () => { throw new Error('Cannot use direct database access in client components'); },
    delete: async () => { throw new Error('Cannot use direct database access in client components'); },
    count: async () => 0,
  };
}

/**
 * Returns a client-safe NotificationRepository
 */
export function getNotificationRepository(): INotificationRepository {
  if (!notificationRepository) {
    notificationRepository = new NotificationRepository();
  }
  return notificationRepository;
}

// Mock repositories for client-side
export function getUserRepository(): IUserRepository {
  return createMockRepository('UserRepository') as unknown as IUserRepository;
}

export function getCustomerRepository(): ICustomerRepository {
  return createMockRepository('CustomerRepository') as unknown as ICustomerRepository;
}

export function getRefreshTokenRepository(): IRefreshTokenRepository {
  return createMockRepository('RefreshTokenRepository') as unknown as IRefreshTokenRepository;
}

export function getActivityLogRepository(): IActivityLogRepository {
  return createMockRepository('ActivityLogRepository') as unknown as IActivityLogRepository;
}

export function getAppointmentRepository(): IAppointmentRepository {
  return createMockRepository('AppointmentRepository') as unknown as IAppointmentRepository;
}

export function getRequestRepository(): IRequestRepository {
  return createMockRepository('RequestRepository') as unknown as IRequestRepository;
}

export function getPermissionRepository(): IPermissionRepository {
  return createMockRepository('PermissionRepository') as unknown as IPermissionRepository;
}

export function getRequestDataRepository(): IRequestDataRepository {
  return createMockRepository('RequestDataRepository') as unknown as IRequestDataRepository;
}

/**
 * Resets all client repository instances 
 */
export function resetRepositories(): void {
  notificationRepository = null;
  RepositoryFactory.instance = null;
}

/**
 * Client-side Repository Factory implementation
 */
export class RepositoryFactory {
  static instance: RepositoryFactory | null = null;

  private constructor() {}

  /**
   * Returns the singleton instance of client RepositoryFactory
   */
  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  /**
   * Creates a mock User Repository instance for client context
   */
  public createUserRepository(): IUserRepository {
    return getUserRepository();
  }

  /**
   * Creates a mock Customer Repository instance for client context
   */
  public createCustomerRepository(): ICustomerRepository {
    return getCustomerRepository();
  }

  /**
   * Creates a mock RefreshToken Repository instance for client context
   */
  public createRefreshTokenRepository(): IRefreshTokenRepository {
    return getRefreshTokenRepository();
  }

  /**
   * Creates a mock ActivityLog Repository instance for client context
   */
  public createActivityLogRepository(): IActivityLogRepository {
    return getActivityLogRepository();
  }

  /**
   * Creates a mock Appointment Repository instance for client context
   */
  public createAppointmentRepository(): IAppointmentRepository {
    return getAppointmentRepository();
  }

  /**
   * Creates a mock Request Repository instance for client context
   */
  public createRequestRepository(): IRequestRepository {
    return getRequestRepository();
  }

  /**
   * Creates a NotificationRepository instance that's client-safe
   */
  public createNotificationRepository(): INotificationRepository {
    return getNotificationRepository();
  }

  /**
   * Creates a mock Permission Repository instance for client context
   */
  public createPermissionRepository(): IPermissionRepository {
    return getPermissionRepository();
  }

  /**
   * Creates a mock RequestData Repository instance for client context
   */
  public createRequestDataRepository(): IRequestDataRepository {
    return getRequestDataRepository();
  }

  /**
   * Resets all repository instances
   */
  public resetRepositories(): void {
    resetRepositories();
  }
}

/**
 * Returns a singleton instance of the client RepositoryFactory
 */
export function getRepositoryFactory(): RepositoryFactory {
  return RepositoryFactory.getInstance();
}
