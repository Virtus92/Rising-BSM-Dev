/**
 * Server-only factory for repository instances
 * This module is exclusively for server contexts and should never be used on the client side.
 */

// Mark as server-only to prevent client-side imports
import 'server-only';

// Import server-only database factory
import { getPrismaClient } from './databaseFactory.server';
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/bootstrap/bootstrap.server';

// Repositories
import { UserRepository } from '@/features/users/lib/repositories/UserRepository';
import { CustomerRepository } from '@/features/customers/lib/repositories/CustomerRepository';
import { AppointmentRepository } from '@/features/appointments/lib/repositories/AppointmentRepository';
import { RequestRepository } from '@/features/requests/lib/repositories/RequestRepository';
import { ActivityLogRepository } from '@/features/activity/lib/repositories/ActivityLogRepository';
import { NotificationRepository } from '@/features/notifications/lib/repositories/NotificationRepository';
import { RefreshTokenRepository } from '@/features/auth/lib/repositories/RefreshTokenRepository';
import { PermissionRepository } from '@/features/permissions/lib/repositories/PermissionRepository';
import { RequestDataRepository } from '@/features/requests/lib/repositories/RequestDataRepository';

// Interfaces
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { IActivityLogRepository } from '@/domain/repositories/IActivityLogRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { IRefreshTokenRepository } from '@/domain/repositories/IRefreshTokenRepository';
import { IPermissionRepository } from '@/domain/repositories/IPermissionRepository';
import { IRequestDataRepository } from '@/domain/repositories/IRequestDataRepository';

/**
 * RepositoryFactory class for uniform creation of repositories
 */
export class RepositoryFactory {
  private static instance: RepositoryFactory;

  // Singleton instances for repositories
  private userRepository?: UserRepository;
  private customerRepository?: CustomerRepository;
  private appointmentRepository?: AppointmentRepository;
  private requestRepository?: RequestRepository;
  private activityLogRepository?: ActivityLogRepository;
  private notificationRepository?: NotificationRepository;
  private refreshTokenRepository?: RefreshTokenRepository;
  private permissionRepository?: PermissionRepository;
  private requestDataRepository?: RequestDataRepository;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Returns the singleton instance of RepositoryFactory
   */
  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  /**
   * Creates an instance of UserRepository
   */
  public createUserRepository(): IUserRepository {
    if (!this.userRepository) {
      const prisma = getPrismaClient();
      this.userRepository = new UserRepository(
        prisma,
        getLogger(),
        getErrorHandler()
      );
    }
    return this.userRepository;
  }

  /**
   * Creates an instance of CustomerRepository
   */
  public createCustomerRepository(): ICustomerRepository {
    if (!this.customerRepository) {
      const prisma = getPrismaClient();
      this.customerRepository = new CustomerRepository(
        prisma,
        getLogger(),
        getErrorHandler()
      );
    }
    return this.customerRepository;
  }

  /**
   * Creates an instance of AppointmentRepository
   */
  public createAppointmentRepository(): IAppointmentRepository {
    if (!this.appointmentRepository) {
      const prisma = getPrismaClient();
      this.appointmentRepository = new AppointmentRepository(
        prisma,
        getLogger(),
        getErrorHandler()
      );
    }
    return this.appointmentRepository;
  }

  /**
   * Creates an instance of RequestRepository
   */
  public createRequestRepository(): IRequestRepository {
    if (!this.requestRepository) {
      const prisma = getPrismaClient();
      this.requestRepository = new RequestRepository(
        prisma,
        getLogger(),
        getErrorHandler()
      );
    }
    return this.requestRepository;
  }

  /**
   * Creates an instance of ActivityLogRepository
   */
  public createActivityLogRepository(): IActivityLogRepository {
    if (!this.activityLogRepository) {
      const prisma = getPrismaClient();
      this.activityLogRepository = new ActivityLogRepository(
        prisma,
        getLogger(),
        getErrorHandler()
      );
    }
    return this.activityLogRepository;
  }

  /**
   * Creates an instance of NotificationRepository
   */
  public createNotificationRepository(): INotificationRepository {
    if (!this.notificationRepository) {
      const prisma = getPrismaClient();
      this.notificationRepository = new NotificationRepository(
        prisma,
        getLogger(),
        getErrorHandler()
      );
    }
    return this.notificationRepository;
  }

  /**
   * Creates an instance of RefreshTokenRepository
   */
  public createRefreshTokenRepository(): IRefreshTokenRepository {
    if (!this.refreshTokenRepository) {
      const prisma = getPrismaClient();
      this.refreshTokenRepository = new RefreshTokenRepository(
        prisma,
        getLogger(),
        getErrorHandler()
      );
    }
    return this.refreshTokenRepository;
  }

  /**
   * Creates an instance of PermissionRepository
   */
  public createPermissionRepository(): IPermissionRepository {
    if (!this.permissionRepository) {
      const prisma = getPrismaClient();
      this.permissionRepository = new PermissionRepository(
        prisma,
        getLogger(),
        getErrorHandler()
      );
    }
    return this.permissionRepository;
  }

  /**
   * Creates an instance of RequestDataRepository
   */
  public createRequestDataRepository(): IRequestDataRepository {
    if (!this.requestDataRepository) {
      const prisma = getPrismaClient();
      this.requestDataRepository = new RequestDataRepository(
        prisma,
        getLogger(),
        getErrorHandler()
      );
    }
    return this.requestDataRepository;
  }

  /**
   * Resets all repository instances
   */
  public resetRepositories(): void {
    this.userRepository = undefined;
    this.customerRepository = undefined;
    this.appointmentRepository = undefined;
    this.requestRepository = undefined;
    this.activityLogRepository = undefined;
    this.notificationRepository = undefined;
    this.refreshTokenRepository = undefined;
    this.permissionRepository = undefined;
    this.requestDataRepository = undefined;
  }
}

/**
 * Returns the singleton instance of RepositoryFactory
 */
export function getRepositoryFactory(): RepositoryFactory {
  return RepositoryFactory.getInstance();
}

// Export individual repository factory functions for backward compatibility
export function getUserRepository(): IUserRepository {
  return getRepositoryFactory().createUserRepository();
}

export function getCustomerRepository(): ICustomerRepository {
  return getRepositoryFactory().createCustomerRepository();
}

export function getAppointmentRepository(): IAppointmentRepository {
  return getRepositoryFactory().createAppointmentRepository();
}

export function getRequestRepository(): IRequestRepository {
  return getRepositoryFactory().createRequestRepository();
}

export function getActivityLogRepository(): IActivityLogRepository {
  return getRepositoryFactory().createActivityLogRepository();
}

export function getNotificationRepository(): INotificationRepository {
  return getRepositoryFactory().createNotificationRepository();
}

export function getRefreshTokenRepository(): IRefreshTokenRepository {
  return getRepositoryFactory().createRefreshTokenRepository();
}

export function getPermissionRepository(): IPermissionRepository {
  return getRepositoryFactory().createPermissionRepository();
}

export function getRequestDataRepository(): IRequestDataRepository {
  return getRepositoryFactory().createRequestDataRepository();
}

export function resetRepositories(): void {
  getRepositoryFactory().resetRepositories();
}
