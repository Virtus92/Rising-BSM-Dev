/**
 * Domain-Modul
 * 
 * Exportiert alle Domain-Komponenten wie Entities, DTOs, Repositories und Services
 * für einfachen Import in andere Teile der Anwendung.
 */

// Enums
export * from './enums/CommonEnums';
export * from './enums/UserEnums';
export * from './enums/EntityTypes';
export * from './enums/ValidationResults';

// Basisklassen und -interfaces
export * from './entities/BaseEntity';
export * from './repositories/IBaseRepository';
export * from './services/IBaseService';
export * from './dtos/BaseDto';

// Entitäten
export * from './entities/User';
export * from './entities/Customer';
export * from './entities/Appointment';
export * from './entities/AppointmentNote';
export * from './entities/ActivityLog';
export * from './entities/ContactRequest';
export * from './entities/Notification';
export * from './entities/RefreshToken';
export * from './entities/RequestNote';

// DTOs
export * from './dtos/UserDtos';
export * from './dtos/CustomerDtos';
export * from './dtos/AppointmentDtos';
export * from './dtos/RequestDtos';
export * from './dtos/AuthDtos';
export * from './dtos/ActivityLogDto';
export * from './dtos/NotificationDtos';
export * from './dtos/LogActionDto';
export * from './dtos/ValidationDto';

// Repositories
export * from './repositories/IUserRepository';
export * from './repositories/ICustomerRepository';
export * from './repositories/IAppointmentRepository';
export * from './repositories/IRequestRepository';
export * from './repositories/IActivityLogRepository';
export * from './repositories/INotificationRepository';
export * from './repositories/IRefreshTokenRepository';

// Services
export * from './services/IUserService';
export * from './services/ICustomerService';
export * from './services/IAppointmentService';
export * from './services/IRequestService';
export * from './services/IAuthService';
export * from './services/IRefreshTokenService';
export * from './services/IActivityLogService';
export * from './services/INotificationService';

// Der folgende Kommentar ist für TypeScript-Deklarationsdateien,
// die nicht direkt exportiert werden können, aber hier dokumentiert werden sollten.
// TypeScript-Typdefinitionen in /domain/types
// - next-auth.d.ts: Erweitert NextAuth-Typen für die Anwendung
// - next.d.ts: Erweitert Next.js-Typen für die Anwendung
