import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaRepository } from './PrismaRepository';
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
   * Ruft die Aktivitäten eines Benutzers ab
   * 
   * @param userId - Benutzer-ID
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Promise mit Benutzeraktivitäten
   */
  async getUserActivity(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    try {
      const activities = await this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
      
      // Mappe auf Domain-Entitäten
      return activities.map(activity => new ActivityLog({
        id: activity.id,
        entityType: EntityType.USER,
        entityId: userId,
        userId: activity.userId,
        action: activity.activity,
        details: activity.details ? JSON.parse(activity.details) : {},
        createdAt: activity.timestamp || new Date(),
        updatedAt: activity.timestamp || new Date()
      }));
    } catch (error) {
      this.logger.error('Error in UserRepository.getUserActivity', { error, userId });
      throw this.handleError(error);
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
   * Implementierung der Aktivitätsprotokollierung
   * 
   * @param userId - Benutzer-ID
   * @param actionType - Aktionstyp
   * @param details - Details
   * @param ipAddress - IP-Adresse
   * @returns Promise mit Protokollergebnis
   */
  protected async logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    try {
      this.logger.info(`Logging activity for user ${userId}: ${actionType}`);

      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: actionType,
          details,
          ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in UserRepository.logActivityImplementation', { 
        error, 
        userId, 
        actionType 
      });
      return null;
    }
  }

  /**
   * Mappt eine ORM-Entität auf eine Domänenentität
   * 
   * @param ormEntity - ORM-Entität
   * @returns Domänenentität
   */
  protected mapToDomainEntity(ormEntity: any): User {
    if (!ormEntity) {
      return null as any;
    }
    
    return new User({
      id: ormEntity.id,
      name: ormEntity.name,
      email: ormEntity.email,
      password: ormEntity.password,
      role: ormEntity.role,
      phone: ormEntity.phone,
      status: ormEntity.status,
      profilePicture: ormEntity.profilePicture,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy,
      lastLoginAt: ormEntity.lastLoginAt,
      resetToken: ormEntity.resetToken,
      resetTokenExpiry: ormEntity.resetTokenExpiry
    });
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
        result[key] = value;
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
