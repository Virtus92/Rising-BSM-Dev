import { ServiceOptions } from './IBaseService';
import { 
  LoginDto, 
  AuthResponseDto, 
  RefreshTokenDto, 
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LogoutDto
} from '../dtos/AuthDtos';

/**
 * Service-Interface für Authentifizierung
 */
export interface IAuthService {
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
   * @returns Gültigkeit des Tokens
   */
  validateResetToken(token: string): Promise<boolean>;
  
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
   * @param refreshToken - Refresh-Token (optional)
   * @param options - Service-Optionen
   * @returns Logout-Ergebnis
   */
  logout(userId: number, refreshToken?: string, options?: ServiceOptions): Promise<{ success: boolean; tokenCount: number }>;
  
  /**
   * Generiert ein Token für das Zurücksetzen des Passworts (nur für Tests)
   * 
   * @param email - E-Mail-Adresse
   * @returns Token und Ablaufzeitpunkt
   */
  getResetTokenForTesting(email: string): Promise<{ token: string; expiry: Date }>;
}
