import { UserRole, UserStatus } from '../enums/UserEnums';

/**
 * DTO für die Erstellung eines Benutzers
 */
export interface CreateUserDto {
  /**
   * Benutzername
   */
  name: string;
  
  /**
   * E-Mail-Adresse
   */
  email: string;
  
  /**
   * Passwort
   */
  password: string;
  
  /**
   * Passwortbestätigung
   */
  passwordConfirm: string;
  
  /**
   * Benutzerrolle
   */
  role?: UserRole;
  
  /**
   * Telefonnummer
   */
  phone?: string;
}

/**
 * DTO für die Aktualisierung eines Benutzers
 */
export interface UpdateUserDto {
  /**
   * Benutzername
   */
  name?: string;
  
  /**
   * E-Mail-Adresse
   */
  email?: string;
  
  /**
   * Benutzerrolle
   */
  role?: UserRole;
  
  /**
   * Benutzerstatus
   */
  status?: UserStatus;
  
  /**
   * Telefonnummer
   */
  phone?: string;
  
  /**
   * Profilbild-URL
   */
  profilePicture?: string;
}

/**
 * DTO für die Rückgabe eines Benutzers
 */
export interface UserResponseDto {
  /**
   * Benutzer-ID
   */
  id: number;
  
  /**
   * Benutzername
   */
  name: string;
  
  /**
   * E-Mail-Adresse
   */
  email: string;
  
  /**
   * Benutzerrolle
   */
  role: string;
  
  /**
   * Benutzerstatus
   */
  status: string;
  
  /**
   * Telefonnummer
   */
  phone?: string;
  
  /**
   * Profilbild-URL
   */
  profilePicture?: string;
  
  /**
   * Erstellungsdatum
   */
  createdAt: string;
  
  /**
   * Letztes Aktualisierungsdatum
   */
  updatedAt: string;
  
  /**
   * Letzter Anmeldezeitpunkt
   */
  lastLoginAt?: string;
}

/**
 * DTO für detaillierte Benutzerinformationen
 */
export interface UserDetailResponseDto extends UserResponseDto {
  /**
   * Benutzeraktivitäten
   */
  activities?: UserActivityDto[];
}

/**
 * DTO für Benutzeraktivitäten
 */
export interface UserActivityDto {
  /**
   * Aktivitäts-ID
   */
  id: number;
  
  /**
   * Aktivitätstyp
   */
  activity: string;
  
  /**
   * Details
   */
  details?: string;
  
  /**
   * IP-Adresse
   */
  ipAddress?: string;
  
  /**
   * Zeitstempel
   */
  timestamp: string;
}

/**
 * DTO für die Änderung des Passworts
 */
export interface ChangePasswordDto {
  /**
   * Aktuelles Passwort
   */
  currentPassword: string;
  
  /**
   * Neues Passwort
   */
  newPassword: string;
  
  /**
   * Bestätigung des neuen Passworts
   */
  confirmPassword: string;
}

/**
 * DTO für die Statusänderung eines Benutzers
 */
export interface UpdateUserStatusDto {
  /**
   * Neuer Status
   */
  status: UserStatus;
  
  /**
   * Grund für die Statusänderung
   */
  reason?: string;
}

/**
 * Filterparameter für Benutzerabfragen
 */
export interface UserFilterParams {
  /**
   * Suchtext
   */
  search?: string;
  
  /**
   * Benutzerrolle
   */
  role?: UserRole;
  
  /**
   * Benutzerstatus
   */
  status?: UserStatus;
  
  /**
   * Startdatum für die Filterung
   */
  startDate?: Date;
  
  /**
   * Enddatum für die Filterung
   */
  endDate?: Date;
  
  /**
   * Seitennummer
   */
  page?: number;
  
  /**
   * Einträge pro Seite
   */
  limit?: number;
  
  /**
   * Sortierfeld
   */
  sortBy?: string;
  
  /**
   * Sortierrichtung
   */
  sortDirection?: 'asc' | 'desc';
}
