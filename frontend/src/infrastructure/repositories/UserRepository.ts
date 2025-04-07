import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaRepository } from './PrismaRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
import { UserFilterParams } from '@/domain/dtos/UserDtos';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

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
  async findUsers(filters: UserFilterParams): Promise<PaginationResult<User>> {
    try {
      // Baue WHERE-Bedingungen
      const where = this.buildUserFilters(filters);
      
      // Extrahiere Paginierungsparameter
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      
      // Baue ORDER BY
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortDirection || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }
      
      // Führe Count-Abfrage aus
      const total = await this.prisma.user.count({ where });
      
      // Führe Hauptabfrage aus
      const users = await this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy
      });
      
      // Mappe auf Domänenentitäten
      const data = users.map(user => this.mapToDomainEntity(user));
      
      // Berechne Paginierungsmetadaten
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
          ]
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
      // Aktualisiere Passwort
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      });
      
      // Mappe auf Domänenentität
      return this.mapToDomainEntity(user);
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
  async getUserActivity(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const activities = await this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
      
      return activities;
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
      
      // Lösche zuerst die Aktivitäten des Benutzers, um Fremdschlüssel-Einschränkungen zu vermeiden
      await this.prisma.userActivity.deleteMany({
        where: { userId }
      });
      
      // Lösche den Benutzer
      await this.prisma.user.delete({
        where: { id: userId }
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in UserRepository.hardDelete', { error, userId });
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
   * Erstellt Benutzerfilter für die Suche
   * 
   * @param filters - Filterparameter
   * @returns ORM-spezifische WHERE-Bedingungen
   */
  protected buildUserFilters(filters: UserFilterParams): any {
    const where: any = {};
    
    // Suchfilter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    // Rollenfilter
    if (filters.role) {
      where.role = filters.role;
    }
    
    // Statusfilter
    if (filters.status) {
      where.status = filters.status;
    }
    
    // Datumsbereichsfilter
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }
    
    return where;
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
