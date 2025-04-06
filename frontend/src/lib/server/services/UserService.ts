import { User } from '@prisma/client';
import { IUserService, UserDto } from '../interfaces/IUserService';
import { IUserRepository, CreateUserData, UpdateUserData } from '../interfaces/IUserRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IValidationService, ValidationResult } from '../interfaces/IValidationService';
import { IErrorHandler } from '../interfaces/IErrorHandler';

/**
 * User-Service-Implementierung
 */
export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private logger: ILoggingService,
    private validator: IValidationService,
    private errorHandler: IErrorHandler
  ) {}
  
  /**
   * Konvertiert ein User-Objekt in ein UserDto
   */
  private toDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
  
  /**
   * Findet alle Benutzer
   */
  async findAll(): Promise<UserDto[]> {
    try {
      this.logger.debug('UserService: Finding all users');
      const users = await this.userRepository.findAll();
      return users.map(user => this.toDto(user));
    } catch (error) {
      throw this.errorHandler.handleError(error, 'UserService.findAll');
    }
  }
  
  /**
   * Findet einen Benutzer anhand seiner ID
   */
  async findById(id: number): Promise<UserDto | null> {
    try {
      this.logger.debug(`UserService: Finding user by ID: ${id}`);
      const user = await this.userRepository.findById(id);
      return user ? this.toDto(user) : null;
    } catch (error) {
      throw this.errorHandler.handleError(error, `UserService.findById(${id})`);
    }
  }
  
  /**
   * Erstellt einen neuen Benutzer
   */
  async create(data: CreateUserData): Promise<UserDto> {
    try {
      this.logger.debug(`UserService: Creating new user: ${data.email}`);
      
      // Validieren der Eingabedaten
      const validationResult = this.validateCreateUserData(data);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError(
          'Validierungsfehler',
          400,
          { errors: validationResult.errors }
        );
      }
      
      // Prüfen, ob E-Mail bereits verwendet wird
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw this.errorHandler.createError(
          'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits',
          409
        );
      }
      
      const user = await this.userRepository.create(data);
      return this.toDto(user);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'UserService.create');
    }
  }
  
  /**
   * Aktualisiert einen Benutzer
   */
  async update(id: number, data: UpdateUserData): Promise<UserDto> {
    try {
      this.logger.debug(`UserService: Updating user: ${id}`);
      
      // Validieren der Eingabedaten
      const validationResult = this.validateUpdateUserData(data);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError(
          'Validierungsfehler',
          400,
          { errors: validationResult.errors }
        );
      }
      
      // Prüfen, ob Benutzer existiert
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw this.errorHandler.createError(
          'Benutzer nicht gefunden',
          404
        );
      }
      
      // Wenn die E-Mail geändert wird, prüfen, ob die neue E-Mail bereits verwendet wird
      if (data.email && data.email !== existingUser.email) {
        const emailExists = await this.userRepository.findByEmail(data.email);
        if (emailExists) {
          throw this.errorHandler.createError(
            'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits',
            409
          );
        }
      }
      
      const user = await this.userRepository.update(id, data);
      return this.toDto(user);
    } catch (error) {
      throw this.errorHandler.handleError(error, `UserService.update(${id})`);
    }
  }
  
  /**
   * Löscht einen Benutzer
   */
  async delete(id: number): Promise<boolean> {
    try {
      this.logger.debug(`UserService: Deleting user: ${id}`);
      
      // Prüfen, ob Benutzer existiert
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw this.errorHandler.createError(
          'Benutzer nicht gefunden',
          404
        );
      }
      
      return await this.userRepository.delete(id);
    } catch (error) {
      throw this.errorHandler.handleError(error, `UserService.delete(${id})`);
    }
  }
  
  /**
   * Validiert die Daten für einen neuen Benutzer
   */
  validateCreateUserData(data: any): ValidationResult {
    return this.validator.validate(data, {
      name: {
        required: true,
        type: 'string',
        min: 3,
        max: 100,
        message: 'Name muss zwischen 3 und 100 Zeichen lang sein'
      },
      email: {
        required: true,
        type: 'string',
        custom: (value) => this.validator.validateEmail(value).isValid,
        message: 'E-Mail-Adresse ist ungültig'
      },
      password: {
        required: true,
        type: 'string',
        custom: (value) => this.validator.validatePassword(value).isValid,
        message: 'Passwort ist zu schwach (mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen)'
      },
      role: {
        required: false,
        type: 'string',
        custom: (value) => ['admin', 'user', 'manager'].includes(value),
        message: 'Ungültige Rolle'
      }
    });
  }
  
  /**
   * Validiert die Daten für ein Benutzer-Update
   */
  validateUpdateUserData(data: any): ValidationResult {
    // Bei Updates sind keine Felder zwingend erforderlich
    return this.validator.validate(data, {
      name: {
        required: false,
        type: 'string',
        min: 3,
        max: 100,
        message: 'Name muss zwischen 3 und 100 Zeichen lang sein'
      },
      email: {
        required: false,
        type: 'string',
        custom: (value) => this.validator.validateEmail(value).isValid,
        message: 'E-Mail-Adresse ist ungültig'
      },
      password: {
        required: false,
        type: 'string',
        custom: (value) => this.validator.validatePassword(value).isValid,
        message: 'Passwort ist zu schwach (mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen)'
      },
      role: {
        required: false,
        type: 'string',
        custom: (value) => ['admin', 'user', 'manager'].includes(value),
        message: 'Ungültige Rolle'
      }
    });
  }
}
