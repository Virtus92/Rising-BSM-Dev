/**
 * Factory-Funktionen für Repository-Instanzen
 */
import { getLogger } from '@/infrastructure/common/logging';
import { getErrorHandler } from '@/infrastructure/common/bootstrap';
import { getPrismaClient } from './databaseFactory';

// Repositories
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { CustomerRepository } from '@/infrastructure/repositories/CustomerRepository';
import { RefreshTokenRepository } from '@/infrastructure/repositories/RefreshTokenRepository';
import { ActivityLogRepository } from '@/infrastructure/repositories/ActivityLogRepository';
import { AppointmentRepository } from '@/infrastructure/repositories/AppointmentRepository';
import { RequestRepository } from '@/infrastructure/repositories/RequestRepository';
import { NotificationRepository } from '@/infrastructure/repositories/NotificationRepository';

// Interfaces
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { IRefreshTokenRepository } from '@/domain/repositories/IRefreshTokenRepository';
import { IActivityLogRepository } from '@/domain/repositories/IActivityLogRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';

// Singleton-Instanzen für Repositories
let userRepository: UserRepository;
let customerRepository: CustomerRepository;
let refreshTokenRepository: RefreshTokenRepository;
let activityLogRepository: ActivityLogRepository;
let appointmentRepository: AppointmentRepository;
let requestRepository: RequestRepository;
let notificationRepository: NotificationRepository;

/**
 * Gibt eine Singleton-Instanz des UserRepository zurück
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
 * Gibt eine Singleton-Instanz des CustomerRepository zurück
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
 * Gibt eine Singleton-Instanz des RefreshTokenRepository zurück
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
 * Gibt eine Singleton-Instanz des ActivityLogRepository zurück
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
 * Gibt eine Singleton-Instanz des AppointmentRepository zurück
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
 * Gibt eine Singleton-Instanz des RequestRepository zurück
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
 * Gibt eine Singleton-Instanz des NotificationRepository zurück
 */
export function getNotificationRepository(): INotificationRepository {
  if (!notificationRepository) {
    // Create properly initialized NotificationRepository
    notificationRepository = new NotificationRepository(
      getLogger(),
      getErrorHandler()
    );
  }
  return notificationRepository;
}

/**
 * Setzt alle Repository-Instanzen zurück
 */
export function resetRepositories(): void {
  userRepository = undefined as any;
  customerRepository = undefined as any;
  refreshTokenRepository = undefined as any;
  activityLogRepository = undefined as any;
  appointmentRepository = undefined as any;
  requestRepository = undefined as any;
  notificationRepository = undefined as any;
}
