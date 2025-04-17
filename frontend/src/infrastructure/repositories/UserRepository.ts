import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaRepository, QueryOptions } from './PrismaRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User, UserRole, UserStatus } from '@/domain/entities/User';
import { UserFilterParamsDto } from '@/domain/dtos/UserDtos';
import { ActivityLog } from '@/domain/entities/ActivityLog';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { EntityType } from '@/domain/enums/EntityTypes';
import { LogActionType } from '@/domain/enums/CommonEnums';

/**
 * Implementierung des UserRepository
 * 
 * Verwendet Prisma als ORM.
 */
export class UserRepository extends PrismaRepository<User> implements IUserRepository {
  /**
   * Konstruktor
   * 
   * @param prisma - Prisma-Client
   * @param logger - Logging-Dienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // 'user' ist der Name des Modells in Prisma
    super(prisma, 'user', logger, errorHandler);
    
    this.logger.debug('Initialized UserRepository');
  }

  /**
   * Erstellt einen neuen Benutzer
   * 
   * @param userData - Benutzerdaten
   * @returns Promise mit erstelltem Benutzer
   */
  async create(userData: Partial<User>): Promise<User> {
    try {
      this.logger.debug('Creating new user', { email: userData.email });
      
      // Bereite Daten für ORM vor
      const data = this.mapToORMEntity(userData);
      
      // Erstelle den Benutzer
      const createdUser = await this.prisma.user.create({ data });
      
      // Protokolliere die Benutzeranlage
      await this.logActivity(
        createdUser.id,
        LogActionType.CREATE,
        'User account created',
        undefined
      );
      
      return this.mapToDomainEntity(createdUser);
    } catch (error) {
      this.logger.error('Error in UserRepository.create', { error, userData });
      throw this.handleError(error);
    }
  }

  /**
   * Findet alle Benutzer
   * 
   * @param options - Abfrageoptionen für Paginierung und Sortierung
   * @returns Promise mit Benutzern und Paginierungsinformationen
   */
  async findAll<U = User>(options?: QueryOptions): Promise<PaginationResult<U>> {
    try {
      this.logger.debug('Finding all users');
      
      // Definiere Paginierungswerte
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const skip = (page - 1) * limit;
      
      // Definiere Sortierung
      const orderBy: any = {};
      if (options?.sort?.field) {
        orderBy[options.sort.field] = options.sort.direction || 'asc';
      } else {
        orderBy.name = 'asc';
      }
      
      // Führe Abfragen aus
      const [total, users] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.findMany({
          skip,
          take: limit,
          orderBy
        })
      ]);
      
      // Mappe auf Domänenentitäten
      const data = users.map(user => this.mapToDomainEntity(user));
      
      // Berechne Paginierungsinformationen
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: data as unknown as U[],
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error in UserRepository.findAll', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Findet einen Benutzer anhand seiner E-Mail-Adresse
   * 
   * @param email - E-Mail-Adresse
   * @returns Promise mit Benutzer oder null
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      this.logger.debug(`Finding user by email: ${email}`);
      
      const user = await this.prisma.user.findUnique({
        where: { email }
      });
      
      return user ? this.mapToDomainEntity(user) : null;
    } catch (error) {
      this.logger.error('Error in UserRepository.findByEmail', { error, email });
      throw this.handleError(error);
    }
  }

  /**
   * Findet einen Benutzer anhand seines Namens
   * 
   * @param name - Name
   * @returns Promise mit Benutzer oder null
   */
  async findByName(name: string): Promise<User | null> {
    try {
      this.logger.debug(`Finding user by name: ${name}`);
      
      const user = await this.prisma.user.findFirst({
        where: { 
          name: { 
            equals: name,
            mode: 'insensitive'
          }
        }
      });
      
      return user ? this.mapToDomainEntity(user) : null;
    } catch (error) {
      this.logger.error('Error in UserRepository.findByName', { error, name });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Benutzer mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @returns Promise mit Benutzern und Paginierung
   */
  async findUsers(filters: UserFilterParamsDto): Promise<PaginationResult<User>> {
    try {
      // Baue WHERE-Bedingungen
      const where: any = {};
      
      // Füge Suchkriterium hinzu
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      // Füge weitere Filter hinzu
      if (filters.role) where.role = filters.role;
      if (filters.status) where.status = filters.status;
      
      // Füge Datumsbereich hinzu
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }
      
      // Berechne Paginierung
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      
      // Bestimme Sortierung
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortDirection || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }
      
      // Führe Abfragen aus
      const [total, users] = await Promise.all([
        // Count-Abfrage für Gesamtanzahl
        this.prisma.user.count({ where }),
        // Daten-Abfrage mit Paginierung
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy
        })
      ]);
      
      // Mappe auf Domänenentitäten
      const data = users.map(user => this.mapToDomainEntity(user));
      
      // Berechne Paginierungsinformationen
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error in UserRepository.findUsers', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Sucht Benutzer anhand eines Suchbegriffs
   * 
   * @param searchText - Suchbegriff
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Promise mit gefundenen Benutzern
   */
  async searchUsers(searchText: string, limit: number = 10): Promise<User[]> {
    try {
      // Bereinige Suchtext
      const search = searchText.trim();
      
      // Führe Suchabfrage aus - Suche nach Name oder E-Mail
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ],
          // Ignoriere gelöschte Benutzer
          NOT: { status: UserStatus.DELETED }
        },
        take: limit,
        orderBy: { name: 'asc' }
      });
      
      // Mappe auf Domänenentitäten
      return users.map(user => this.mapToDomainEntity(user));
    } catch (error) {
      this.logger.error('Error in UserRepository.searchUsers', { error, searchText });
      throw this.handleError(error);
    }
  }

  /**
   * Aktualisiert das Passwort eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param hashedPassword - Gehashtes Passwort
   * @returns Promise mit aktualisiertem Benutzer
   */
  async updatePassword(userId: number, hashedPassword: string): Promise<User> {
    try {
      // Aktualisiere Passwort und lösche Reset-Token
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          updatedAt: new Date()
        }
      });
      
      // Protokolliere die Passwortänderung
      await this.logActivity(
        userId,
        LogActionType.CHANGE_PASSWORD,
        'Password changed',
        undefined
      );
      
      return this.mapToDomainEntity(updatedUser);
    } catch (error) {
      this.logger.error('Error in UserRepository.updatePassword', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Gets the activities of a user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of results
   * @returns Promise with user activities
   */
  async getUserActivity(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    try {
      // Determine which Prisma model to use for activity logs
      let activityModel: any;
      
      // Try to find the appropriate model for activity logs
      // Check if these properties exist in Prisma client
      if ('userActivity' in this.prisma) {
        activityModel = (this.prisma as any).userActivity;
      } else if ('activityLog' in this.prisma) {
        activityModel = (this.prisma as any).activityLog;
      } else {
        this.logger.warn('No suitable activity log model found in Prisma schema. Returning empty activity list.');
        return [];
      }

      // Fetch activity logs using the determined model
      const activities = await activityModel.findMany({
        where: { 
          userId
        },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
      
      // Map to domain entities with proper null checks and error handling for each activity
      return activities.map((activity: any) => {
        try {
          let parsedDetails = {};
          
          // Safely parse JSON details if present
          if (activity.details) {
            if (typeof activity.details === 'string') {
              try {
                parsedDetails = JSON.parse(activity.details);
              } catch (parseError) {
                // If parsing fails, use the string directly
                parsedDetails = { rawDetails: activity.details };
              }
            } else {
              // If it's already an object, use it directly
              parsedDetails = activity.details;
            }
          }
          
          return new ActivityLog({
            id: activity.id,
            entityType: EntityType.USER,
            entityId: userId,
            userId: activity.userId,
            action: activity.activity || '',
            details: parsedDetails,
            createdAt: activity.timestamp || new Date(),
            updatedAt: activity.timestamp || new Date()
          });
        } catch (mapError) {
          // If mapping a specific activity fails, log error but don't fail the whole operation
          this.logger.error('Error mapping activity log:', {
            error: mapError instanceof Error ? mapError.message : String(mapError),
            activityId: activity.id
          });
          
          // Return a minimal valid ActivityLog
          return new ActivityLog({
            id: activity.id || 0,
            entityType: EntityType.USER,
            entityId: userId,
            userId: userId,
            action: 'unknown',
            details: { error: 'Failed to parse activity data' },
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });
    } catch (error) {
      this.logger.error('Error in UserRepository.getUserActivity', { 
        error: error instanceof Error ? error.message : String(error), 
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      // Return empty array instead of throwing to maintain UI stability
      return [];
    }
  }

  /**
   * Löscht einen Benutzer dauerhaft
   * 
   * @param userId - Benutzer-ID
   * @returns Promise mit Erfolg der Operation
   */
  async hardDelete(userId: number): Promise<boolean> {
    try {
      this.logger.debug(`Hard deleting user with ID: ${userId}`);
      
      // Führe eine Transaktion aus, um Datenintegrität zu gewährleisten
      await this.prisma.$transaction(async (tx) => {
        // Lösche zuerst die abhängigen Entitäten
        await tx.userActivity.deleteMany({
          where: { userId }
        });
        
        await tx.refreshToken.deleteMany({
          where: { userId }
        });
        
        // Lösche UserSettings, falls vorhanden
        await tx.userSettings.deleteMany({
          where: { userId }
        });
        
        // Lösche den Benutzer selbst
        await tx.user.delete({
          where: { id: userId }
        });
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in UserRepository.hardDelete', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Setzt ein Token zum Zurücksetzen des Passworts
   * 
   * @param userId - Benutzer-ID
   * @param token - Reset-Token
   * @param expiry - Ablaufzeitpunkt
   * @returns Promise mit aktualisiertem Benutzer
   */
  async setResetToken(userId: number, token: string, expiry: Date): Promise<User> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          resetToken: token,
          resetTokenExpiry: expiry,
          updatedAt: new Date()
        }
      });
      
      // Protokolliere die Token-Generierung
      await this.logActivity(
        userId,
        LogActionType.RESET_PASSWORD,
        'Password reset token generated',
        undefined
      );
      
      return this.mapToDomainEntity(updatedUser);
    } catch (error) {
      this.logger.error('Error in UserRepository.setResetToken', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Prüft, ob ein Reset-Token gültig ist
   * 
   * @param token - Reset-Token
   * @returns Benutzer-ID, wenn gültig, sonst null
   */
  async validateResetToken(token: string): Promise<number | null> {
    try {
      // Suche einen Benutzer mit diesem Token und gültiger Ablaufzeit
      const user = await this.prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date() // Token muss in der Zukunft ablaufen
          }
        }
      });
      
      return user ? user.id : null;
    } catch (error) {
      this.logger.error('Error in UserRepository.validateResetToken', { error, token });
      throw this.handleError(error);
    }
  }

  /**
   * Aktualisiert den letzten Anmeldezeitpunkt
   * 
   * @param userId - Benutzer-ID
   * @returns Aktualisierter Benutzer
   */
  async updateLastLogin(userId: number): Promise<User> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Protokolliere die Anmeldung
      await this.logActivity(
        userId,
        LogActionType.LOGIN,
        'User logged in',
        undefined
      );
      
      return this.mapToDomainEntity(updatedUser);
    } catch (error) {
      this.logger.error('Error in UserRepository.updateLastLogin', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Aktualisiert das Profilbild eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param profilePictureUrl - URL des Profilbilds
   * @returns Aktualisierter Benutzer
   */
  async updateProfilePicture(userId: number, profilePictureUrl: string): Promise<User> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: profilePictureUrl,
          updatedAt: new Date()
        }
      });
      
      // Protokolliere die Aktualisierung
      await this.logActivity(
        userId,
        LogActionType.UPDATE,
        'Profile picture updated',
        undefined
      );
      
      return this.mapToDomainEntity(updatedUser);
    } catch (error) {
      this.logger.error('Error in UserRepository.updateProfilePicture', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Implementation of activity logging
   * 
   * @param userId - User ID
   * @param actionType - Action type
   * @param details - Details
   * @param ipAddress - IP address
   * @returns Promise with log result
   */
  protected async logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    try {
      this.logger.info(`Logging activity for user ${userId}: ${actionType}`);

      // Check if userActivity model exists in Prisma schema
      if (!this.prisma.userActivity) {
        this.logger.warn('UserActivity model not found in Prisma schema. Activity logging skipped.');
        return null;
      }

      // Use consistent table reference based on Prisma model
      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: actionType,
          details: details ? details : undefined,
          ipAddress: ipAddress ? ipAddress : undefined,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in UserRepository.logActivityImplementation', { 
        error: error instanceof Error ? error.message : String(error), 
        userId, 
        actionType,
        stack: error instanceof Error ? error.stack : undefined
      });
      // Log but don't throw error for activity logging
      // This prevents core functionality from failing due to logging issues
      return null;
    }
  }

  /**
   * Maps an ORM entity to a domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity or null if input is null
   */
  protected mapToDomainEntity(ormEntity: any): User {
    if (!ormEntity) {
      // Instead of returning null, throw a meaningful error
      this.logger.error('Cannot map empty entity to User domain object');
      throw this.errorHandler.createError('Failed to map database entity to domain entity: Entity is null or undefined');
    }
    
    try {
      // Ensure role and status are valid enum values
      let role = UserRole.USER;
      let status = UserStatus.ACTIVE;
      
      // If role is provided, validate it against the enum
      if (ormEntity.role) {
        const isValidRole = Object.values(UserRole).includes(ormEntity.role as UserRole);
        role = isValidRole ? (ormEntity.role as UserRole) : UserRole.USER;
      }
      
      // If status is provided, validate it against the enum
      if (ormEntity.status) {
        const isValidStatus = Object.values(UserStatus).includes(ormEntity.status as UserStatus);
        status = isValidStatus ? (ormEntity.status as UserStatus) : UserStatus.ACTIVE;
      }
      
      return new User({
        id: ormEntity.id,
        name: ormEntity.name || '',
        email: ormEntity.email || '',
        password: ormEntity.password,
        role: role,
        status: status,
        phone: ormEntity.phone,
        profilePicture: ormEntity.profilePicture,
        createdAt: ormEntity.createdAt ? new Date(ormEntity.createdAt) : new Date(),
        updatedAt: ormEntity.updatedAt ? new Date(ormEntity.updatedAt) : new Date(),
        createdBy: ormEntity.createdBy,
        updatedBy: ormEntity.updatedBy,
        lastLoginAt: ormEntity.lastLoginAt ? new Date(ormEntity.lastLoginAt) : undefined,
        resetToken: ormEntity.resetToken,
        resetTokenExpiry: ormEntity.resetTokenExpiry ? new Date(ormEntity.resetTokenExpiry) : undefined
      });
    } catch (error) {
      this.logger.error('Error mapping ORM entity to domain entity:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        entityId: ormEntity.id
      });
      throw this.errorHandler.createError('Failed to map database entity to domain entity');
    }
  }

  /**
   * Mappt eine Domänenentität auf eine ORM-Entität
   * 
   * @param domainEntity - Domänenentität
   * @returns ORM-Entität
   */
  protected mapToORMEntity(domainEntity: Partial<User>): any {
    // Entferne undefined-Eigenschaften
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined) {
        // Special handling for permissions to match Prisma's expectations
        if (key === 'permissions') {
          // Don't include empty permissions array as it causes Prisma errors
          if (!Array.isArray(value) || value.length > 0) {
            // Format permissions for Prisma update
            result[key] = {
              set: Array.isArray(value) ? value.map(id => ({ id })) : []
            };
          }
          // If permissions is an empty array, don't include it at all
        } else {
          result[key] = value;
        }
      }
    });
    
    // Setze Zeitstempel für Erstellungen/Aktualisierungen
    if (!result.createdAt && !result.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }

  /**
   * Verarbeitet Kriterien für das ORM
   * 
   * @param criteria - Filterkriterien
   * @returns ORM-spezifische Kriterien
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const where: any = {};
    
    // Verarbeite jedes Kriterium
    for (const [key, value] of Object.entries(criteria)) {
      // Behandle komplexe Kriterien
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Objekt mit Operatoren wie {eq, gt, lt, etc.}
        const operators: Record<string, any> = {};
        
        for (const [op, opValue] of Object.entries(value)) {
          switch (op) {
            case 'eq':
              operators.equals = opValue;
              break;
            case 'neq':
              operators.not = opValue;
              break;
            case 'gt':
              operators.gt = opValue;
              break;
            case 'gte':
              operators.gte = opValue;
              break;
            case 'lt':
              operators.lt = opValue;
              break;
            case 'lte':
              operators.lte = opValue;
              break;
            case 'contains':
              operators.contains = opValue;
              operators.mode = 'insensitive';
              break;
            case 'startsWith':
              operators.startsWith = opValue;
              break;
            case 'endsWith':
              operators.endsWith = opValue;
              break;
            case 'in':
              operators.in = opValue;
              break;
            case 'notIn':
              operators.notIn = opValue;
              break;
            default:
              // Unbekannter Operator, übergebe ihn einfach
              operators[op] = opValue;
          }
        }
        
        where[key] = operators;
      } else {
        // Einfache Gleichheit
        where[key] = value;
      }
    }
    
    return where;
  }
}
