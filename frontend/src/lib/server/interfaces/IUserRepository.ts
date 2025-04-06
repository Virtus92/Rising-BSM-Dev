import { User } from '@prisma/client';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface IUserRepository {
  /**
   * Findet alle Benutzer
   */
  findAll(): Promise<User[]>;
  
  /**
   * Findet einen Benutzer anhand seiner ID
   */
  findById(id: number): Promise<User | null>;
  
  /**
   * Findet einen Benutzer anhand seiner E-Mail
   */
  findByEmail(email: string): Promise<User | null>;
  
  /**
   * Erstellt einen neuen Benutzer
   */
  create(data: CreateUserData): Promise<User>;
  
  /**
   * Aktualisiert einen Benutzer
   */
  update(id: number, data: UpdateUserData): Promise<User>;
  
  /**
   * Löscht einen Benutzer
   */
  delete(id: number): Promise<boolean>;
}
