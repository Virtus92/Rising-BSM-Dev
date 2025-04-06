import { PrismaClient } from '@prisma/client';
import prisma from '../db/prisma';
import { LoggingService } from './core/LoggingService';
import { ErrorHandler } from './core/ErrorHandler';
import { ValidationService } from './core/ValidationService';
import { UserRepository } from './repositories/UserRepository';
import { RefreshTokenRepository } from './repositories/RefreshTokenRepository';
import { CustomerRepository } from './repositories/CustomerRepository';
import { ProjectRepository } from './repositories/ProjectRepository';
import { AppointmentRepository } from './repositories/AppointmentRepository';
import { ServiceRepository } from './repositories/ServiceRepository';
import { NotificationRepository } from './repositories/NotificationRepository';
import { ContactRepository } from './repositories/ContactRepository';
import { UserService } from './services/UserService';
import { AuthService } from './services/AuthService';
import { CustomerService } from './services/CustomerService';
import { ProjectService } from './services/ProjectService';
import { AppointmentService } from './services/AppointmentService';
import { ServiceService } from './services/ServiceService';
import { NotificationService } from './services/NotificationService';
import { DashboardService } from './services/DashboardService';
import { ContactService } from './services/ContactService';
import { ProfileService } from './services/ProfileService';
import { SettingsService } from './services/SettingsService';

import { ILoggingService, LogLevel, LogFormat } from './interfaces/ILoggingService';
import { IErrorHandler } from './interfaces/IErrorHandler';
import { IValidationService } from './interfaces/IValidationService';
import { IUserRepository } from './interfaces/IUserRepository';
import { IRefreshTokenRepository } from './interfaces/IRefreshTokenRepository';
import { ICustomerRepository } from './interfaces/ICustomerRepository';
import { IProjectRepository } from './interfaces/IProjectRepository';
import { IAppointmentRepository } from './interfaces/IAppointmentRepository';
import { IServiceRepository } from './interfaces/IServiceRepository';
import { INotificationRepository } from './interfaces/INotificationRepository';
import { IContactRepository } from './interfaces/IContactRepository';
import { IUserService } from './interfaces/IUserService';
import { IAuthService } from './interfaces/IAuthService';
import { ICustomerService } from './interfaces/ICustomerService';
import { IProjectService } from './interfaces/IProjectService';
import { IAppointmentService } from './interfaces/IAppointmentService';
import { IServiceService } from './interfaces/IServiceService';
import { INotificationService } from './interfaces/INotificationService';
import { IDashboardService } from './interfaces/IDashboardService';
import { IContactService } from './interfaces/IContactService';
import { IProfileService } from './interfaces/IProfileService';
import { ISettingsService } from './interfaces/ISettingsService';

// Erweitere globale Deklaration für Next.js-Umgebungen
declare global {
  // eslint-disable-next-line no-var
  var __diContainer: DIContainer | undefined;
}

/**
 * Verbesserte Implementierung des Dependency Injection Containers
 * - Echtes Singleton-Pattern für alle Umgebungen
 * - Robuste, idempotente Initialisierung
 * - Sichere Service-Auflösung mit Fallback-Optionen
 */
export class DIContainer {
  private static _instance: DIContainer | null = null;
  private services: Map<string, any> = new Map();
  private initialized: boolean = false;
  private initializing: boolean = false;
  private readonly instanceId: string = crypto.randomUUID();
  
  // Privater Konstruktor verhindert direkte Instanziierung
  private constructor() {
    console.log(`DIContainer instance created with ID: ${this.instanceId}`);
  }
  
  /**
   * Gibt die Singleton-Instanz des Containers zurück
   * Implementiert echtes Singleton-Pattern für alle Umgebungen
   */
  public static getInstance(): DIContainer {
    if (!DIContainer._instance) {
      // Verwenden von globalThis für Entwicklungsumgebung
      // um Persistenz über Hot-Reloads hinweg zu gewährleisten
      if (process.env.NODE_ENV === 'development' && typeof globalThis !== 'undefined') {
        if (!globalThis.__diContainer) {
          globalThis.__diContainer = new DIContainer();
        }
        DIContainer._instance = globalThis.__diContainer;
      } else {
        DIContainer._instance = new DIContainer();
      }
    }
    
    return DIContainer._instance;
  }
  
  /**
   * Gibt die Instanz-ID des Containers zurück
   */
  public getInstanceId(): string {
    return this.instanceId;
  }

  /**
   * Prüft, ob der Container initialisiert wurde
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Prüft, ob der Container gerade initialisiert wird
   */
  public isInitializing(): boolean {
    return this.initializing;
  }

  /**
   * Initialisiert den Container mit allen Standard-Services
   * Implementiert idempotentes Verhalten - kann mehrfach aufgerufen werden
   */
  public initialize(): DIContainer {
    // Verhindern von Mehrfachinitialisierung oder rekursiver Initialisierung
    if (this.initialized || this.initializing) {
      return this;
    }
    
    this.initializing = true;
    
    try {
      // Erstelle Logger zuerst, bevor andere Services initialisiert werden
      const logger = new LoggingService({
        level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
        format: (process.env.NODE_ENV === 'production' ? LogFormat.JSON : LogFormat.PRETTY)
      });
      
      // Logger sofort registrieren, um zirkuläre Abhängigkeiten zu vermeiden
      this.services.set('LoggingService', logger);
      
      logger.info(`Initialisiere DI-Container [${this.instanceId}]...`);
      
      // Core-Services registrieren
      this.register('PrismaClient', prisma);
      // LoggingService wurde bereits registriert
      
      const errorHandler = new ErrorHandler(
        logger,
        process.env.NODE_ENV !== 'production'
      );
      this.register<IErrorHandler>('ErrorHandler', errorHandler);
      
      const validationService = new ValidationService();
      this.register<IValidationService>('ValidationService', validationService);
      
      // Repositories registrieren
      this.register<IUserRepository>('UserRepository', new UserRepository(
        prisma,
        logger,
        errorHandler
      ));
      
      this.register<IRefreshTokenRepository>('RefreshTokenRepository', new RefreshTokenRepository(
        prisma,
        logger,
        errorHandler
      ));
      
      this.register<ICustomerRepository>('CustomerRepository', new CustomerRepository(
        prisma,
        logger,
        errorHandler
      ));
      
      this.register<IProjectRepository>('ProjectRepository', new ProjectRepository(
        prisma,
        logger,
        errorHandler
      ));
      
      this.register<IAppointmentRepository>('AppointmentRepository', new AppointmentRepository(
        prisma,
        logger,
        errorHandler
      ));
      
      this.register<IServiceRepository>('ServiceRepository', new ServiceRepository(
        prisma,
        logger,
        errorHandler
      ));
      
      this.register<INotificationRepository>('NotificationRepository', new NotificationRepository(
        prisma,
        logger,
        errorHandler
      ));
      
      this.register<IContactRepository>('ContactRepository', new ContactRepository(
        prisma,
        logger,
        errorHandler
      ));
      
      // Services registrieren
      const userRepository = this.resolve<IUserRepository>('UserRepository');
      this.register<IUserService>('UserService', new UserService(
        userRepository,
        logger,
        validationService,
        errorHandler
      ));
      
      const refreshTokenRepository = this.resolve<IRefreshTokenRepository>('RefreshTokenRepository');
      this.register<IAuthService>('AuthService', new AuthService(
        userRepository,
        refreshTokenRepository,
        logger,
        errorHandler,
        validationService
      ));
      
      const customerRepository = this.resolve<ICustomerRepository>('CustomerRepository');
      this.register<ICustomerService>('CustomerService', new CustomerService(
        customerRepository,
        logger,
        errorHandler,
        validationService
      ));
      
      const projectRepository = this.resolve<IProjectRepository>('ProjectRepository');
      this.register<IProjectService>('ProjectService', new ProjectService(
        projectRepository,
        logger,
        errorHandler,
        validationService
      ));
      
      const appointmentRepository = this.resolve<IAppointmentRepository>('AppointmentRepository');
      this.register<IAppointmentService>('AppointmentService', new AppointmentService(
        appointmentRepository,
        logger,
        errorHandler,
        validationService
      ));
      
      const serviceRepository = this.resolve<IServiceRepository>('ServiceRepository');
      this.register<IServiceService>('ServiceService', new ServiceService(
        serviceRepository,
        logger,
        errorHandler,
        validationService
      ));
      
      const notificationRepository = this.resolve<INotificationRepository>('NotificationRepository');
      this.register<INotificationService>('NotificationService', new NotificationService(
        notificationRepository,
        logger,
        errorHandler,
        validationService
      ));
      
      const projectService = this.resolve<IProjectService>('ProjectService');
      const appointmentService = this.resolve<IAppointmentService>('AppointmentService');
      const notificationService = this.resolve<INotificationService>('NotificationService');
      
      this.register<IDashboardService>('DashboardService', new DashboardService(
        prisma,
        logger,
        errorHandler,
        projectService,
        appointmentService,
        notificationService
      ));
      
      const contactRepository = this.resolve<IContactRepository>('ContactRepository');
      this.register<IContactService>('ContactService', new ContactService(
        contactRepository,
        logger,
        errorHandler,
        validationService,
        notificationService
      ));
      
      this.register<IProfileService>('ProfileService', new ProfileService(
        prisma,
        logger,
        errorHandler,
        validationService
      ));
      
      this.register<ISettingsService>('SettingsService', new SettingsService(
        prisma,
        logger,
        errorHandler,
        validationService
      ));
      
      this.initialized = true;
      logger.info(`DI-Container [${this.instanceId}] initialisiert.`);
    } catch (error) {
      console.error('Fehler bei der Initialisierung des DI-Containers:', error);
      // Trotz Fehlers einige Basis-Services verfügbar machen
      if (!this.services.has('LoggingService')) {
        const fallbackLogger = new LoggingService({
          level: LogLevel.ERROR,
          format: LogFormat.PRETTY
        });
        this.services.set('LoggingService', fallbackLogger);
      }
    } finally {
      this.initializing = false;
    }
    
    return this;
  }
  
  /**
   * Registriert einen Service im Container
   * @param name Name des Services
   * @param instance Instanz des Services
   */
  public register<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }
  
  /**
   * Löst einen Service aus dem Container auf
   * @param name Name des Services
   * @param defaultValue Optionaler Standardwert, falls Service nicht gefunden
   * @returns Die Service-Instanz
   */
  public resolve<T>(name: string, defaultValue?: T): T {
    // Versuchen, den Container zu initialisieren, wenn noch nicht geschehen
    // Aber nur, wenn nicht gerade initialisiert wird (Vermeidung von Rekursion)
    if (!this.initialized && !this.initializing) {
      this.initialize();
    }
    
    const service = this.services.get(name);
    
    if (!service) {
      // Spezialfall: LoggingService
      if (name === 'LoggingService' && !this.initializing) {
        // Fallback-Logger erstellen
        const fallbackLogger = new LoggingService({
          level: LogLevel.ERROR,
          format: LogFormat.PRETTY
        });
        this.services.set('LoggingService', fallbackLogger);
        return fallbackLogger as T;
      }
      
      // Wenn ein Standardwert bereitgestellt wurde, diesen zurückgeben
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      
      throw new Error(`Service ${name} not found in container`);
    }
    
    return service as T;
  }
  
  /**
   * Prüft, ob ein Service im Container registriert ist
   * @param name Name des Services
   * @returns true, wenn der Service registriert ist
   */
  public has(name: string): boolean {
    return this.services.has(name);
  }
  
  /**
   * Entfernt einen Service aus dem Container
   * @param name Name des Services
   */
  public remove(name: string): boolean {
    return this.services.delete(name);
  }
  
  /**
   * Setzt den Container zurück (für Tests)
   */
  public reset(): void {
    this.services.clear();
    this.initialized = false;
    this.initializing = false;
  }
}

/**
 * Erstellt oder gibt die Singleton-Instanz des DI-Containers zurück
 * und initialisiert sie, falls noch nicht geschehen
 */
const container = DIContainer.getInstance().initialize();

// Exportieren der Container-Instanz
export { container };

// Für Debug-Zwecke: Singleton-Status prüfen
if (process.env.NODE_ENV === 'development') {
  console.log(`DI-Container initialisiert mit ID: ${container.getInstanceId()}`); 
}
