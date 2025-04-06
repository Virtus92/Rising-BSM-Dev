/**
 * Interface für den Auth-Service
 */
export interface IAuthService {
  /**
   * Authentifiziert einen Benutzer mit Email und Passwort
   */
  authenticate(email: string, password: string, ipAddress?: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    }
  }>;

  /**
   * Aktualisiert ein Access-Token mit einem Refresh-Token
   */
  refreshToken(token: string, ipAddress?: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;

  /**
   * Widerruft ein Refresh-Token
   */
  revokeToken(token: string, ipAddress?: string): Promise<void>;

  /**
   * Überprüft die Gültigkeit eines Tokens
   */
  validateToken(token: string): Promise<boolean>;

  /**
   * Generiert ein Passwort-Reset-Token
   */
  generateResetToken(email: string): Promise<string>;

  /**
   * Setzt ein Passwort mit einem Reset-Token zurück
   */
  resetPassword(token: string, newPassword: string): Promise<boolean>;

  /**
   * Ändert das Passwort eines Benutzers
   */
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean>;

  /**
   * Registriert einen neuen Benutzer
   */
  register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<{
    id: number;
    name: string;
    email: string;
    role: string;
  }>;
}
