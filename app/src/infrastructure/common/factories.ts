/**
 * Factory-Funktionen zur Erstellung von Dependency-Instanzen (VERALTET)
 * 
 * HINWEIS: Diese Datei ist veraltet und wird durch die Module unter /factories/ ersetzt.
 * Sie bleibt nur zur Kompatibilität bestehen und sollte in neuen Code nicht mehr verwendet werden.
 */

/**
 * Re-exporte die neue ServiceFactory für Kompatibilität
 */
export { 
  getServiceFactory,
  getAuthService,
  getUserService,
  getCustomerService,
  getAppointmentService,
  getRequestService,
  getActivityLogService,
  getNotificationService,
  getRefreshTokenService
} from './factories/serviceFactory';

/**
 * Re-exporte die Repository-Factories für Kompatibilität
 */
export {
  getUserRepository,
  getCustomerRepository,
  getRefreshTokenRepository,
  getActivityLogRepository,
  getAppointmentRepository,
  getRequestRepository,
  getNotificationRepository
} from './factories/repositoryFactory';

/**
 * Re-exporte die Datenbank-Factory für Kompatibilität
 */
export {
  getPrismaClient
} from './factories/databaseFactory';
