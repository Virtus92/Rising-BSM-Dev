import { IBaseService, ServiceOptions } from './IBaseService';
import { User } from '../entities/User';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto, 
  UserDetailResponseDto,
  ChangePasswordDto,
  UpdateUserStatusDto,
  UserFilterParams
} from '../dtos/UserDtos';
import { PaginationResult } from '../repositories/IBaseRepository';

/**
 * Service-Interface für Benutzer
 */
export interface IUserService extends IBaseService<User, CreateUserDto, UpdateUserDto, UserResponseDto> {
  /**
   * Findet einen Benutzer anhand seiner E-Mail-Adresse
   * 
   * @param email - E-Mail-Adresse
   * @returns Gefundener Benutzer oder null
   */
  findByEmail(email: string): Promise<UserResponseDto | null>;
  
  /**
   * Findet einen Benutzer anhand seines Namens
   * 
   * @param name - Name
   * @returns Gefundener Benutzer oder null
   */
  findByName(name: string): Promise<UserResponseDto | null>;
  
  /**
   * Ruft detaillierte Benutzerinformationen ab
   * 
   * @param id - Benutzer-ID
   * @param options - Service-Optionen
   * @returns Detaillierte Benutzerinformationen oder null
   */
  getUserDetails(id: number, options?: ServiceOptions): Promise<UserDetailResponseDto | null>;
  
  /**
   * Findet Benutzer mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @returns Gefundene Benutzer mit Paginierung
   */
  findUsers(filters: UserFilterParams): Promise<PaginationResult<UserResponseDto>>;
  
  /**
   * Ändert das Passwort eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param data - Passwortänderungsdaten
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  changePassword(userId: number, data: ChangePasswordDto, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Aktualisiert den Status eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param data - Statusänderungsdaten
   * @param options - Service-Optionen
   * @returns Aktualisierter Benutzer
   */
  updateStatus(userId: number, data: UpdateUserStatusDto, options?: ServiceOptions): Promise<UserResponseDto>;
  
  /**
   * Sucht Benutzer anhand eines Suchbegriffs
   * 
   * @param searchText - Suchbegriff
   * @param options - Service-Optionen
   * @returns Gefundene Benutzer
   */
  searchUsers(searchText: string, options?: ServiceOptions): Promise<UserResponseDto[]>;
  
  /**
   * Ruft Benutzerstatistiken ab
   * 
   * @returns Benutzerstatistiken
   */
  getUserStatistics(): Promise<any>;
  
  /**
   * Führt einen Soft Delete eines Benutzers durch
   * 
   * @param userId - Benutzer-ID
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  softDelete(userId: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Führt einen Hard Delete eines Benutzers durch
   * 
   * @param userId - Benutzer-ID
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  hardDelete(userId: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Authentifiziert einen Benutzer
   * 
   * @param email - E-Mail-Adresse
   * @param password - Passwort
   * @returns Authentifizierter Benutzer oder null
   */
  authenticate(email: string, password: string): Promise<UserResponseDto | null>;
}
