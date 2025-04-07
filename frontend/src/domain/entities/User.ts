import { BaseEntity } from './BaseEntity';
import { UserRole, UserStatus } from '../enums/UserEnums';

/**
 * Benutzer-Entität
 * 
 * Repräsentiert einen Benutzer im System.
 */
export class User extends BaseEntity {
  /**
   * Benutzername
   */
  name: string;
  
  /**
   * E-Mail-Adresse
   */
  email: string;
  
  /**
   * Gehashtes Passwort
   */
  password?: string;
  
  /**
   * Benutzerrolle
   */
  role: UserRole;
  
  /**
   * Telefonnummer
   */
  phone?: string;
  
  /**
   * Benutzerstatus
   */
  status: UserStatus;
  
  /**
   * Profilbild-URL
   */
  profilePicture?: string;
  
  /**
   * Letzter Anmeldezeitpunkt
   */
  lastLoginAt?: Date;
  
  /**
   * Token zum Zurücksetzen des Passworts
   */
  resetToken?: string;
  
  /**
   * Ablaufzeitpunkt des Tokens zum Zurücksetzen des Passworts
   */
  resetTokenExpiry?: Date;
  
  /**
   * Konstruktor
   * 
   * @param data - Initialisierungsdaten
   */
  constructor(data: Partial<User> = {}) {
    super(data);
    
    this.name = data.name || '';
    this.email = data.email || '';
    this.password = data.password;
    this.role = data.role || UserRole.USER;
    this.phone = data.phone;
    this.status = data.status || UserStatus.ACTIVE;
    this.profilePicture = data.profilePicture;
    this.lastLoginAt = data.lastLoginAt ? new Date(data.lastLoginAt) : undefined;
    this.resetToken = data.resetToken;
    this.resetTokenExpiry = data.resetTokenExpiry ? new Date(data.resetTokenExpiry) : undefined;
  }
  
  /**
   * Gibt den Vornamen zurück
   */
  get firstName(): string {
    return this.name.split(' ')[0];
  }
  
  /**
   * Gibt den Nachnamen zurück
   */
  get lastName(): string {
    const nameParts = this.name.split(' ');
    return nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  }
  
  /**
   * Gibt den vollständigen Namen zurück
   */
  getFullName(): string {
    return this.name.trim();
  }
  
  /**
   * Prüft, ob der Benutzer aktiv ist
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
  
  /**
   * Prüft, ob der Benutzer Admin-Rechte hat
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
  
  /**
   * Prüft, ob der Benutzer eine bestimmte Rolle hat
   * 
   * @param role - Zu prüfende Rolle
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }
  
  /**
   * Zeichnet eine Anmeldung auf
   */
  recordLogin(): User {
    this.lastLoginAt = new Date();
    return this;
  }
  
  /**
   * Ändert das Passwort des Benutzers
   * 
   * @param hashedPassword - Neues gehashtes Passwort
   */
  changePassword(hashedPassword: string): User {
    this.password = hashedPassword;
    this.resetToken = undefined;
    this.resetTokenExpiry = undefined;
    this.updateAuditData();
    return this;
  }
  
  /**
   * Setzt ein Token zum Zurücksetzen des Passworts
   * 
   * @param token - Token zum Zurücksetzen
   * @param expiryHours - Ablaufzeit in Stunden
   */
  setResetToken(token: string, expiryHours: number = 24): User {
    this.resetToken = token;
    
    // Ablaufzeit setzen
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + expiryHours);
    this.resetTokenExpiry = expiry;
    
    return this;
  }
  
  /**
   * Prüft, ob ein Token zum Zurücksetzen des Passworts gültig ist
   * 
   * @param token - Zu prüfendes Token
   */
  isResetTokenValid(token: string): boolean {
    if (!this.resetToken || !this.resetTokenExpiry) {
      return false;
    }
    
    // Prüfen, ob das Token übereinstimmt
    if (this.resetToken !== token) {
      return false;
    }
    
    // Prüfen, ob das Token nicht abgelaufen ist
    return this.resetTokenExpiry > new Date();
  }
  
  /**
   * Aktualisiert den Benutzerstatus
   * 
   * @param status - Neuer Status
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   */
  updateStatus(status: UserStatus, updatedBy?: number): User {
    this.status = status;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Deaktiviert den Benutzer
   * 
   * @param updatedBy - ID des Benutzers, der die Deaktivierung durchführt
   */
  deactivate(updatedBy?: number): User {
    return this.updateStatus(UserStatus.INACTIVE, updatedBy);
  }
  
  /**
   * Aktiviert den Benutzer
   * 
   * @param updatedBy - ID des Benutzers, der die Aktivierung durchführt
   */
  activate(updatedBy?: number): User {
    return this.updateStatus(UserStatus.ACTIVE, updatedBy);
  }
  
  /**
   * Markiert den Benutzer als gelöscht (Soft Delete)
   * 
   * @param updatedBy - ID des Benutzers, der die Löschung durchführt
   */
  softDelete(updatedBy?: number): User {
    return this.updateStatus(UserStatus.DELETED, updatedBy);
  }
  
  /**
   * Aktualisiert die Benutzerdaten
   * 
   * @param data - Neue Daten
   * @param updatedBy - ID des Benutzers, der die Aktualisierung durchführt
   */
  update(data: Partial<User>, updatedBy?: number): User {
    // Nur definierte Eigenschaften aktualisieren
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.role !== undefined) this.role = data.role;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.status !== undefined) this.status = data.status;
    if (data.profilePicture !== undefined) this.profilePicture = data.profilePicture;
    if (data.password !== undefined) this.password = data.password;
    
    // Auditdaten aktualisieren
    this.updateAuditData(updatedBy);
    
    return this;
  }
  
  /**
   * Konvertiert die Entität in ein einfaches Objekt
   */
  override toObject(): Record<string, any> {
    const baseObject = super.toObject();
    
    // Passwort und Token entfernen
    const { password, resetToken, resetTokenExpiry, ...safeData } = {
      name: this.name,
      email: this.email,
      role: this.role,
      phone: this.phone,
      status: this.status,
      profilePicture: this.profilePicture,
      lastLoginAt: this.lastLoginAt
    };
    
    return { ...baseObject, ...safeData };
  }
}
