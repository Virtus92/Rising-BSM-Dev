import { User } from '@prisma/client';
import { CreateUserData, UpdateUserData } from './IUserRepository';
import { ValidationResult } from './IValidationService';

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserService {
  /**
   * Findet alle Benutzer
   */
  findAll(): Promise<UserDto[]>;
  
  /**
   * Findet einen Benutzer anhand seiner ID
   */
  findById(id: number): Promise<UserDto | null>;
  
  /**
   * Erstellt einen neuen Benutzer
   */
  create(data: CreateUserData): Promise<UserDto>;
  
  /**
   * Aktualisiert einen Benutzer
   */
  update(id: number, data: UpdateUserData): Promise<UserDto>;
  
  /**
   * Löscht einen Benutzer
   */
  delete(id: number): Promise<boolean>;
  
  /**
   * Validiert die Daten für einen neuen Benutzer
   */
  validateCreateUserData(data: any): ValidationResult;
  
  /**
   * Validiert die Daten für ein Benutzer-Update
   */
  validateUpdateUserData(data: any): ValidationResult;
}
