import { ServiceOptions } from './IBaseService';
import { 
  LoginDto, 
  AuthResponseDto, 
  RefreshTokenDto, 
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LogoutDto,
  RegisterDto
} from '../dtos/AuthDtos';

/**
 * Service-Interface für Authentifizierung
 */
export interface IAuthService {
  /**
   * Registriert einen neuen Benutzer
   * 
   * @param registerDto - Registrierungsdaten
   * @param options - Service-Optionen
   * @returns Registrierungsergebnis
   */
  register(registerDto: RegisterDto, options?: ServiceOptions): Promise<{ success: boolean; message?: string; data?: any }>;
  
  /**
   * Führt den Login eines Benutzers durch
   * 
   * @param loginDto - Login-Daten
   * @param options - Service-Optionen
   * @returns Authentifizierungsantwort
   */
  login(loginDto: LoginDto, options?: ServiceOptions): Promise<AuthResponseDto>;
  
  /**
   * Aktualisiert ein Token
   * 
   * @param refreshTokenDto - Token-Aktualisierungsdaten
   * @param options - Service-Optionen
   * @returns Token-Aktualisierungsantwort
   */
  refreshToken(refreshTokenDto: RefreshTokenDto, options?: ServiceOptions): Promise<RefreshTokenResponseDto>;
  
  /**
   * Verarbeitet eine "Passwort vergessen"-Anfrage
   * 
   * @param forgotPasswordDto - "Passwort vergessen"-Daten
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  forgotPassword(forgotPasswordDto: ForgotPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }>;
  
  /**
   * Validiert ein Token für das Zurücksetzen des Passworts
   * 
   * @param token - Token
   * @param options - Service-Optionen
   * @returns Gültigkeit des Tokens
   */
  validateResetToken(token: string, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Setzt ein Passwort zurück
   * 
   * @param resetPasswordDto - Passwort-Zurücksetzungsdaten
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  resetPassword(resetPasswordDto: ResetPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }>;
  
  /**
   * Führt den Logout eines Benutzers durch
   * 
   * @param userId - Benutzer-ID
   * @param logoutDto - Logout-Daten
   * @param options - Service-Optionen
   * @returns Logout-Ergebnis
   */
  logout(userId: number, logoutDto?: LogoutDto, options?: ServiceOptions): Promise<{ success: boolean; tokenCount: number }>;
  
  /**
   * Überprüft, ob ein Benutzer authentifiziert ist
   * 
   * @param token - Access-Token
   * @param options - Service-Optionen
   * @returns Authentifizierungsstatus
   */
  verifyToken(token: string, options?: ServiceOptions): Promise<{ valid: boolean; userId?: number; }>;
  
  /**
   * Überprüft, ob ein Benutzer die angegebene Rolle hat
   * 
   * @param userId - Benutzer-ID
   * @param role - Zu überprüfende Rolle
   * @param options - Service-Optionen
   * @returns Ob der Benutzer die Rolle hat
   */
  hasRole(userId: number, role: string, options?: ServiceOptions): Promise<boolean>;
}