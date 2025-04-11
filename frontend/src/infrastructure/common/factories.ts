/**
 * Factory-Funktionen zur Erstellung von Dependency-Instanzen (VERALTET)
 * 
 * HINWEIS: Diese Datei ist veraltet und wird durch die Module unter /factories/ ersetzt.
 * Sie bleibt nur zur Kompatibilität bestehen und sollte in neuen Code nicht mehr verwendet werden.
 */
import { PrismaClient } from '@prisma/client';
import { getLogger } from '@/infrastructure/common/logging';
import { getErrorHandler, getValidationService } from '@/infrastructure/common/bootstrap';
import { prisma as prismaInstance } from '@/infrastructure/common/database/prisma';

// Repositories
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { CustomerRepository } from '@/infrastructure/repositories/CustomerRepository';
import { RefreshTokenRepository } from '@/infrastructure/repositories/RefreshTokenRepository';
import { ActivityLogRepository } from '@/infrastructure/repositories/ActivityLogRepository';
import { AppointmentRepository } from '@/infrastructure/repositories/AppointmentRepository';
import { RequestRepository } from '@/infrastructure/repositories/RequestRepository';
import { NotificationRepository } from '@/infrastructure/repositories/NotificationRepository';

// Services
import { AuthService } from '@/infrastructure/services/AuthService';
import { UserService } from '@/infrastructure/services/UserService';
import { CustomerService } from '@/infrastructure/services/CustomerService';
import { AppointmentService } from '@/infrastructure/services/AppointmentService';
import { RequestService } from '@/infrastructure/services/RequestService';
import { ActivityLogService } from '@/infrastructure/services/ActivityLogService';
import { NotificationService } from '@/infrastructure/services/NotificationService';
import { RefreshTokenService } from '@/infrastructure/services/RefreshTokenService';

// Interfaces
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { IRefreshTokenRepository } from '@/domain/repositories/IRefreshTokenRepository';
import { IActivityLogRepository } from '@/domain/repositories/IActivityLogRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';

import { IAuthService } from '@/domain/services/IAuthService';
import { IUserService } from '@/domain/services/IUserService';
import { ICustomerService } from '@/domain/services/ICustomerService';
import { IAppointmentService } from '@/domain/services/IAppointmentService';
import { IRequestService } from '@/domain/services/IRequestService';
import { IActivityLogService } from '@/domain/services/IActivityLogService';
import { INotificationService } from '@/domain/services/INotificationService';
import { IRefreshTokenService } from '@/domain/services/IRefreshTokenService';

// Singleton-Instanzen für Repositories
let prismaClient: PrismaClient;
let userRepository: UserRepository;
let customerRepository: CustomerRepository;
let refreshTokenRepository: RefreshTokenRepository;
let activityLogRepository: ActivityLogRepository;
let appointmentRepository: AppointmentRepository;
let requestRepository: RequestRepository;
let notificationRepository: NotificationRepository;

// Singleton-Instanzen für Services
let authService: AuthService;
let userService: UserService;
let customerService: CustomerService;
let appointmentService: AppointmentService;
let requestService: RequestService;
let activityLogService: ActivityLogService;
let notificationService: NotificationService;
let refreshTokenService: RefreshTokenService;

/**
 * Gibt eine Singleton-Instanz des PrismaClient zurück
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = prismaInstance;
  }
  return prismaClient;
}

// Repository Factory-Funktionen

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
    notificationRepository = new NotificationRepository(
      getPrismaClient(),
      getLogger(),
      getErrorHandler()
    );
  }
  return notificationRepository;
}

// Service Factory-Funktionen

/**
 * Gibt eine Singleton-Instanz des AuthService zurück
 */
export function getAuthService(): IAuthService {
  if (!authService) {
    authService = new AuthService(
      getUserRepository(),
      getRefreshTokenRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler(),
      {
        jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-please-change-in-production',
        accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY 
          ? parseInt(process.env.ACCESS_TOKEN_EXPIRY) 
          : 900, // 15 Minuten in Sekunden
        refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY 
          ? parseInt(process.env.REFRESH_TOKEN_EXPIRY) 
          : 604800, // 7 Tage in Sekunden
        useTokenRotation: process.env.USE_TOKEN_ROTATION !== 'false'
      }
    );
  }
  return authService;
}

/**
 * Gibt eine Singleton-Instanz des UserService zurück
 */
export function getUserService(): IUserService {
  if (!userService) {
    // Create a properly initialized UserService instance
    const staticUserService = new UserService(
      getUserRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
    
    // For now, use type assertion to bridge the interface gap
    // This is a temporary solution until the service is fully implemented
    userService = staticUserService as any as UserService;
  }
  return userService as unknown as IUserService;
}

/**
 * Gibt eine Singleton-Instanz des CustomerService zurück
 */
export function getCustomerService(): ICustomerService {
  if (!customerService) {
    // Create a properly initialized CustomerService instance
    const staticCustomerService = new CustomerService(
      getCustomerRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
    
    // For now, use type assertion to bridge the interface gap
    // This is a temporary solution until the service is fully implemented
    customerService = staticCustomerService as any as CustomerService;
  }
  return customerService as unknown as ICustomerService;
}

/**
 * Gibt eine Singleton-Instanz des AppointmentService zurück
 */
export function getAppointmentService(): IAppointmentService {
  if (!appointmentService) {
    // For now, create a minimal implementation with type assertion
    // This will be replaced with a proper implementation later
    appointmentService = {
      getAppointmentDetails: async () => null,
      findByCustomer: async () => [],
      findByDateRange: async () => [],
      updateStatus: async () => ({ id: 0 }) as any,
      addNote: async () => true,
      getUpcoming: async () => [],
      getAll: async () => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      getById: async () => null,
      create: async () => ({ id: 0 }) as any,
      update: async () => ({ id: 0 }) as any,
      delete: async () => true
    } as unknown as AppointmentService;
  }
  return appointmentService as unknown as IAppointmentService;
}

/**
 * Gibt eine Singleton-Instanz des RequestService zurück
 */
export function getRequestService(): IRequestService {
  if (!requestService) {
    // For now, create a minimal implementation with type assertion
    // This will be replaced with a proper implementation later
    requestService = {
      createRequest: async () => ({ id: 0 }) as any,
      findRequests: async () => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      findRequestById: async () => ({ id: 0 }) as any,
      updateRequest: async () => ({ id: 0 }) as any,
      updateRequestStatus: async () => ({ id: 0 }) as any,
      deleteRequest: async () => true,
      addNote: async () => ({ id: 0 }) as any,
      assignRequest: async () => ({ id: 0 }) as any,
      convertToCustomer: async () => ({ customer: { id: 0 } as any, request: { id: 0 } as any }),
      linkToCustomer: async () => ({ id: 0 }) as any,
      createAppointmentForRequest: async () => ({ id: 0 }) as any,
      getRequestStats: async () => ({ totalRequests: 0, newRequests: 0, inProgressRequests: 0, completedRequests: 0, cancelledRequests: 0, conversionRate: 0 }),
      getAll: async () => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      getById: async () => null,
      create: async () => ({ id: 0 }) as any,
      update: async () => ({ id: 0 }) as any,
      delete: async () => true
    } as unknown as RequestService;
  }
  return requestService as unknown as IRequestService;
}

/**
 * Gibt eine Singleton-Instanz des ActivityLogService zurück
 */
export function getActivityLogService(): IActivityLogService {
  if (!activityLogService) {
    activityLogService = new ActivityLogService(
      getActivityLogRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return activityLogService;
}

/**
 * Gibt eine Singleton-Instanz des NotificationService zurück
 */
export function getNotificationService(): INotificationService {
  if (!notificationService) {
    notificationService = new NotificationService(
      getNotificationRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return notificationService;
}

/**
 * Gibt eine Singleton-Instanz des RefreshTokenService zurück
 */
export function getRefreshTokenService(): IRefreshTokenService {
  if (!refreshTokenService) {
    refreshTokenService = new RefreshTokenService(
      getRefreshTokenRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return refreshTokenService;
}

/**
 * Setzt alle Singleton-Instanzen zurück (vor allem für Tests)
 */
export function resetSingletons(): void {
  // Repositories zurücksetzen
  prismaClient = undefined as any;
  userRepository = undefined as any;
  customerRepository = undefined as any;
  refreshTokenRepository = undefined as any;
  activityLogRepository = undefined as any;
  appointmentRepository = undefined as any;
  requestRepository = undefined as any;
  notificationRepository = undefined as any;
  
  // Services zurücksetzen
  authService = undefined as any;
  userService = undefined as any;
  customerService = undefined as any;
  appointmentService = undefined as any;
  requestService = undefined as any;
  activityLogService = undefined as any;
  notificationService = undefined as any;
  refreshTokenService = undefined as any;
}
