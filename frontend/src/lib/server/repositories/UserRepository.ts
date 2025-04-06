import { PrismaClient, User } from '@prisma/client';
import { IUserRepository, CreateUserData, UpdateUserData } from '../interfaces/IUserRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';
import bcrypt from 'bcryptjs';

/**
 * User-Repository-Implementierung mit Prisma
 */
export class UserRepository implements IUserRepository {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler
  ) {}
  
  /**
   * Findet alle Benutzer
   */
  async findAll(): Promise<User[]> {
    try {
      this.logger.debug('Finding all users');
      return await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          password: false // Passwort nicht zurückgeben
        }
      }) as User[];
    } catch (error) {
      throw this.errorHandler.handleError(error, 'UserRepository.findAll');
    }
  }
  
  /**
   * Findet einen Benutzer anhand seiner ID
   */
  async findById(id: number): Promise<User | null> {
    try {
      this.logger.debug(`Finding user by ID: ${id}`);
      return await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          password: false // Passwort nicht zurückgeben
        }
      }) as User | null;
    } catch (error) {
      throw this.errorHandler.handleError(error, `UserRepository.findById(${id})`);
    }
  }
  
  /**
   * Findet einen Benutzer anhand seiner E-Mail
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      this.logger.debug(`Finding user by email: ${email}`);
      return await this.prisma.user.findUnique({
        where: { email },
        // Hier das Password inkludieren, da es für Auth-Checks benötigt wird
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, `UserRepository.findByEmail(${email})`);
    }
  }
  
  /**
   * Erstellt einen neuen Benutzer
   */
  async create(data: CreateUserData): Promise<User> {
    try {
      this.logger.debug(`Creating new user: ${data.email}`);
      
      // Passwort hashen
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      return await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
          role: data.role || 'user' // Standardrolle, wenn keine angegeben
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          password: false // Passwort nicht zurückgeben
        }
      }) as User;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'UserRepository.create');
    }
  }
  
  /**
   * Aktualisiert einen Benutzer
   */
  async update(id: number, data: UpdateUserData): Promise<User> {
    try {
      this.logger.debug(`Updating user: ${id}`);
      
      const updateData: any = { ...data };
      
      // Wenn ein neues Passwort angegeben wurde, dieses hashen
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
      
      return await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          password: false // Passwort nicht zurückgeben
        }
      }) as User;
    } catch (error) {
      throw this.errorHandler.handleError(error, `UserRepository.update(${id})`);
    }
  }
  
  /**
   * Löscht einen Benutzer
   */
  async delete(id: number): Promise<boolean> {
    try {
      this.logger.debug(`Deleting user: ${id}`);
      await this.prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      throw this.errorHandler.handleError(error, `UserRepository.delete(${id})`);
    }
  }
}
