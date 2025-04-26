/**
 * Factory functions for repository instances
 */
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/bootstrap';
import { getPrismaClient } from './databaseFactory';

// Repositories
import { UserRepository } from '@/features/users/lib/repositories/UserRepository';
import { CustomerRepository } from '@/features/customers/lib/repositories/CustomerRepository';
import { RefreshTokenRepository } from '@/features/auth/lib/repositories/RefreshTokenRepository';
import { ActivityLogRepository } from '@/features/activity/lib/repositories/ActivityLogRepository';
import { AppointmentRepository } from '@/features/appointments/lib/repositories/AppointmentRepository';
import { RequestRepository } from '@/features/requests/lib/repositories/RequestRepository';
import { NotificationRepository } from '@/features/notifications/lib/repositories/NotificationRepository';
import { PermissionRepository } from '@/features/permissions/lib/repositories/PermissionRepository';
import { RequestDataRepository } from '@/features/requests/lib/repositories/RequestDataRepository';

// Interfaces
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { IRefreshTokenRepository } from '@/domain/repositories/IRefreshTokenRepository';
import { IActivityLogRepository } from '@/domain/repositories/IActivityLogRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { IPermissionRepository } from '@/domain/repositories/IPermissionRepository';
import { IRequestDataRepository } from '@/domain/repositories/IRequestDataRepository';

// Singleton instances for repositories
let userRepository: UserRepository;
let customerRepository: CustomerRepository;
let refreshTokenRepository: RefreshTokenRepository;
let activityLogRepository: ActivityLogRepository;
let appointmentRepository: AppointmentRepository;
let requestRepository: RequestRepository;
let notificationRepository: NotificationRepository;
let permissionRepository: PermissionRepository;
let requestDataRepository: RequestDataRepository;

/**
 * Returns a singleton instance of UserRepository
 */
export function getUserRepository(): IUserRepository {
  if (!userRepository) {
    userRepository = new UserRepository(
      getPrismaClient(),
      getLogger(),
      getErrorHandler()
    );
  }
  return userRepository;
}

/**
 * Returns a singleton instance of CustomerRepository
 */
export function getCustomerRepository(): ICustomerRepository {
  if (!customerRepository) {
    customerRepository = new CustomerRepository(
      getPrismaClient(),
      getLogger(),
      getErrorHandler()
    );
  }
  return customerRepository;
}

/**
 * Returns a singleton instance of RefreshTokenRepository
 */
export function getRefreshTokenRepository(): IRefreshTokenRepository {
  if (!refreshTokenRepository) {
    refreshTokenRepository = new RefreshTokenRepository(
      getPrismaClient(),
      getLogger(),
      getErrorHandler()
    );
  }
  return refreshTokenRepository;
}

/**
 * Returns a singleton instance of ActivityLogRepository
 */
export function getActivityLogRepository(): IActivityLogRepository {
  if (!activityLogRepository) {
    activityLogRepository = new ActivityLogRepository(
      getPrismaClient(),
      getLogger(),
      getErrorHandler()
    );
  }
  return activityLogRepository;
}

/**
 * Returns a singleton instance of AppointmentRepository
 */
export function getAppointmentRepository(): IAppointmentRepository {
  if (!appointmentRepository) {
    appointmentRepository = new AppointmentRepository(
      getPrismaClient(),
      getLogger(),
      getErrorHandler()
    );
  }
  return appointmentRepository;
}

/**
 * Returns a singleton instance of RequestRepository
 */
export function getRequestRepository(): IRequestRepository {
  if (!requestRepository) {
    requestRepository = new RequestRepository(
      getPrismaClient(),
      getLogger(),
      getErrorHandler()
    );
  }
  return requestRepository;
}

/**
 * Returns a singleton instance of RequestDataRepository
 */
export function getRequestDataRepository(): IRequestDataRepository {
  if (!requestDataRepository) {
    requestDataRepository = new RequestDataRepository(
      getPrismaClient(),
      getLogger(),
      getErrorHandler()
    );
  }
  return requestDataRepository;
}

/**
 * Returns a singleton instance of NotificationRepository
 */
export function getNotificationRepository(): INotificationRepository {
  if (!notificationRepository) {
    // Create properly initialized NotificationRepository with prisma client
    notificationRepository = new NotificationRepository(
      getPrismaClient(),
      getLogger(),
      getErrorHandler()
    );
  }
  return notificationRepository;
}

/**
 * Returns a singleton instance of PermissionRepository
 */
export function getPermissionRepository(): IPermissionRepository {
  if (!permissionRepository) {
    permissionRepository = new PermissionRepository(
      getPrismaClient(),
      getLogger(),
      getErrorHandler()
    );
  }
  return permissionRepository;
}

/**
 * Resets all repository instances
 */
export function resetRepositories(): void {
  userRepository = undefined as any;
  customerRepository = undefined as any;
  refreshTokenRepository = undefined as any;
  activityLogRepository = undefined as any;
  appointmentRepository = undefined as any;
  requestRepository = undefined as any;
  notificationRepository = undefined as any;
  permissionRepository = undefined as any;
  requestDataRepository = undefined as any;
  RepositoryFactory.instance = undefined as any;
}

/**
 * Repository Factory class for centralized repository creation
 */
export class RepositoryFactory {
  static instance: RepositoryFactory;

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
   * Creates a User Repository instance
   */
  public createUserRepository(): IUserRepository {
    return getUserRepository();
  }

  /**
   * Creates a Customer Repository instance
   */
  public createCustomerRepository(): ICustomerRepository {
    return getCustomerRepository();
  }

  /**
   * Creates a RefreshToken Repository instance
   */
  public createRefreshTokenRepository(): IRefreshTokenRepository {
    return getRefreshTokenRepository();
  }

  /**
   * Creates an ActivityLog Repository instance
   */
  public createActivityLogRepository(): IActivityLogRepository {
    return getActivityLogRepository();
  }

  /**
   * Creates an Appointment Repository instance
   */
  public createAppointmentRepository(): IAppointmentRepository {
    return getAppointmentRepository();
  }

  /**
   * Creates a Request Repository instance
   */
  public createRequestRepository(): IRequestRepository {
    return getRequestRepository();
  }

  /**
   * Creates a Notification Repository instance
   */
  public createNotificationRepository(): INotificationRepository {
    return getNotificationRepository();
  }

  /**
   * Creates a Permission Repository instance
   */
  public createPermissionRepository(): IPermissionRepository {
    return getPermissionRepository();
  }

  /**
   * Creates a RequestData Repository instance
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
 * Returns a singleton instance of the RepositoryFactory
 */
export function getRepositoryFactory(): RepositoryFactory {
  return RepositoryFactory.getInstance();
}
