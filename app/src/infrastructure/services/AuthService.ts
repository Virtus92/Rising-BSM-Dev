import { IAuthService } from '@/domain/services/IAuthService';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '@/domain/repositories/IRefreshTokenRepository';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { 
  LoginDto, 
  AuthResponseDto, 
  RefreshTokenDto, 
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RegisterDto
} from '@/domain/dtos/AuthDtos';
import { ServiceOptions } from '@/domain/services/IBaseService';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole, UserStatus } from '@/domain/entities/User'; 

/**
 * Service für Authentifizierungsfunktionen
 */
export class AuthService implements IAuthService {
  /**
   * JWT-Secret für Token-Signierung
   */
  private readonly jwtSecret: string;
  
  /**
   * Token-Ablaufzeit für Access Tokens in Sekunden
   */
  private readonly accessTokenExpiry: number;
  
  /**
   * Token-Ablaufzeit für Refresh Tokens in Tagen
   */
  private readonly refreshTokenExpiry: number;
  
  /**
   * Ob Token-Rotation aktiviert ist
   */
  private readonly useTokenRotation: boolean;
  
  /**
   * Konstruktor
   * 
   * @param userRepository - Repository für Benutzer
   * @param refreshTokenRepository - Repository für Refresh Tokens
   * @param logger - Logging-Dienst
   * @param validator - Validierungsdienst
   * @param errorHandler - Fehlerbehandlungsdienst
   * @param config - Konfiguration
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly logger: ILoggingService,
    private readonly validator: IValidationService,
    private readonly errorHandler: IErrorHandler,
    config?: {
      jwtSecret?: string;
      accessTokenExpiry?: number;
      refreshTokenExpiry?: number;
      useTokenRotation?: boolean;
    }
  ) {
    this.jwtSecret = config?.jwtSecret || process.env.JWT_SECRET || 'default-secret-change-me';
    this.accessTokenExpiry = config?.accessTokenExpiry || 15 * 60; // 15 Minuten in Sekunden
    this.refreshTokenExpiry = config?.refreshTokenExpiry || 7; // 7 Tage
    this.useTokenRotation = config?.useTokenRotation !== undefined ? config.useTokenRotation : true;
    
    this.logger.debug('Initialized AuthService');
    
    // Starte einen Hintergrundprozess zum Löschen abgelaufener Tokens
    this.scheduleTokenCleanup();
  }

  /**
   * Führt den Login eines Benutzers durch
   * 
   * @param loginDto - Login-Daten
   * @param options - Service-Optionen
   * @returns Authentifizierungsantwort
   */
  async login(loginDto: LoginDto, options?: ServiceOptions): Promise<AuthResponseDto> {
    try {
      // Validiere die Eingabedaten
      const schema = {
        email: { type: 'string', format: 'email', required: true },
        password: { type: 'string', minLength: 1, required: true },
        remember: { type: 'boolean' }
      };
      
      const { isValid, errors } = this.validator.validate(loginDto, schema);
      
      if (!isValid) {
        // Wir werfen einen Fehler mit den Validierungsfehlern
        throw this.errorHandler.createValidationError('Invalid login data', errors);
      }
      
      // Suche den Benutzer anhand der E-Mail-Adresse
      const user = await this.userRepository.findByEmail(loginDto.email);
      
      // Falls kein Benutzer gefunden wurde oder das Passwort falsch ist
      if (!user || !(await this.verifyPassword(loginDto.password, user.password || ''))) {
        throw this.errorHandler.createUnauthorizedError('Invalid email or password');
      }
      
      // Prüfe, ob der Benutzer aktiv ist
      if (!user.isActive()) {
        throw this.errorHandler.createForbiddenError('Account is inactive');
      }
      
      // Aktualisiere den letzten Anmeldezeitpunkt - use specialized method to avoid permissions mapping issues
      await this.userRepository.updateLastLogin(user.id);
      
      // Erstelle ein Access Token
      const accessToken = this.generateAccessToken(user);
      
      // Berechne die Ablaufzeit für Refresh Tokens
      const refreshTokenExpiryDays = loginDto.remember 
        ? this.refreshTokenExpiry * 2 // Verlängerte Ablaufzeit bei "Angemeldet bleiben"
        : this.refreshTokenExpiry;
      
      // Erstelle ein Refresh Token
      const refreshToken = await this.generateRefreshToken(
        user.id,
        refreshTokenExpiryDays,
        options?.context?.ipAddress
      );
      
      // Protokolliere die Anmeldung
      await this.userRepository.logActivity(
        user.id,
        'LOGIN',
        'User logged in',
        options?.context?.ipAddress
      );
      
      // Erstelle die Authentifizierungsantwort
      return {
        id: user.id,
        accessToken,
        refreshToken: refreshToken.token,
        expiresIn: this.accessTokenExpiry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt.toString(),
          updatedAt: user.updatedAt.toString()
        }
      };
    } catch (error) {
      this.logger.error('Error in AuthService.login', { error, email: loginDto.email });
      throw error;
    }
  }

  /**
   * Aktualisiert ein Token
   * 
   * @param refreshTokenDto - Token-Aktualisierungsdaten
   * @param options - Service-Optionen
   * @returns Token-Aktualisierungsantwort
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto, 
    options?: ServiceOptions
  ): Promise<RefreshTokenResponseDto> {
    try {
      // Validiere die Eingabedaten
      const schema = {
        refreshToken: { type: 'string', minLength: 1, required: true }
      };
      
      const { isValid, errors } = this.validator.validate(refreshTokenDto, schema);
      
      if (!isValid) {
        throw this.errorHandler.createValidationError('Invalid refresh token data', errors);
      }
      
      // Suche das Refresh Token
      const refreshToken = await this.refreshTokenRepository.findByToken(refreshTokenDto.refreshToken);
      
      // Falls kein Token gefunden wurde
      if (!refreshToken) {
        throw this.errorHandler.createUnauthorizedError('Invalid refresh token');
      }
      
      // Prüfe, ob das Token widerrufen wurde
      if (refreshToken.isRevoked) {
        // Widerrufe alle Tokens des Benutzers für zusätzliche Sicherheit
        await this.revokeUserTokens(refreshToken.userId, options?.context?.ipAddress);
        
        throw this.errorHandler.createUnauthorizedError('Refresh token has been revoked');
      }
      
      // Prüfe, ob das Token abgelaufen ist
      if (refreshToken.expiresAt < new Date()) {
        throw this.errorHandler.createUnauthorizedError('Refresh token has expired');
      }
      
      // Suche den Benutzer
      const user = await this.userRepository.findById(refreshToken.userId);
      
      // Falls kein Benutzer gefunden wurde
      if (!user) {
        throw this.errorHandler.createUnauthorizedError('User not found');
      }
      
      // Prüfe, ob der Benutzer aktiv ist
      if (!user.isActive()) {
        throw this.errorHandler.createForbiddenError('Account is inactive');
      }
      
      // Erstelle ein neues Access Token
      const accessToken = this.generateAccessToken(user);
      
      // Berechne die Anzahl der Tage bis zum Ablauf
      const expiryDays = this.refreshTokenExpiry;
      
      // Token-Rotation, wenn aktiviert
      let newRefreshToken = refreshToken;
      
      if (this.useTokenRotation) {
        // Widerrufe das alte Token
        await this.revokeRefreshToken(
          refreshToken.token,
          options?.context?.ipAddress,
          'Replaced by new token'
        );
        
        // Erstelle ein neues Refresh Token
        newRefreshToken = await this.generateRefreshToken(
          user.id,
          expiryDays,
          options?.context?.ipAddress
        );
      }
      
      // Protokolliere die Token-Aktualisierung
      await this.userRepository.logActivity(
        user.id,
        'TOKEN_REFRESH',
        'Access token refreshed',
        options?.context?.ipAddress
      );
      
      // Erstelle die Token-Aktualisierungsantwort
      return {
        id: user.id,
        accessToken,
        refreshToken: newRefreshToken.token,
        expiresIn: this.accessTokenExpiry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error in AuthService.refreshToken', { error });
      throw error;
    }
  }

  /**
   * Verarbeitet eine "Passwort vergessen"-Anfrage
   * 
   * @param forgotPasswordDto - "Passwort vergessen"-Daten
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto, 
    options?: ServiceOptions
  ): Promise<{ success: boolean }> {
    try {
      // Validiere die Eingabedaten
      const schema = {
        email: { type: 'string', format: 'email', required: true }
      };
      
      const { isValid, errors } = this.validator.validate(forgotPasswordDto, schema);
      
      if (!isValid) {
        throw this.errorHandler.createValidationError('Invalid email', errors);
      }
      
      // Suche den Benutzer anhand der E-Mail-Adresse
      const user = await this.userRepository.findByEmail(forgotPasswordDto.email);
      
      // Wenn kein Benutzer gefunden wurde, geben wir trotzdem Erfolg zurück
      // (aus Sicherheitsgründen, um keine Information über existierende E-Mail-Adressen preiszugeben)
      if (!user) {
        this.logger.info(`Password reset requested for non-existent email: ${forgotPasswordDto.email}`);
        return { success: true };
      }
      
      // Generiere ein Reset-Token
      const token = crypto.randomBytes(40).toString('hex');
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24); // 24 Stunden gültig
      
      // Setze das Reset-Token für den Benutzer
      const updatedUser = user.setResetToken(token, 24);
      await this.userRepository.update(user.id, updatedUser);
      
      // Protokolliere die Anfrage
      await this.userRepository.logActivity(
        user.id,
        'PASSWORD_RESET_REQUESTED',
        'Password reset token generated',
        options?.context?.ipAddress
      );
      
      // Hier würden wir normalerweise eine E-Mail senden
      // Dies ist ein Platzhalter für die tatsächliche E-Mail-Versendung
      this.logger.info(`Password reset token for ${user.email}: ${token}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error in AuthService.forgotPassword', { error, email: forgotPasswordDto.email });
      throw error;
    }
  }

  /**
   * Validiert ein Token für das Zurücksetzen des Passworts
   * 
   * @param token - Token
   * @returns Gültigkeit des Tokens
   */
  async validateResetToken(token: string): Promise<boolean> {
    try {
      // Validiere den Token
      if (!token || token.length < 10 || typeof token !== 'string') {
        return false;
      }
      
      // Suche einen Benutzer mit diesem Reset-Token
      const user = await this.userRepository.findOneByCriteria({ resetToken: token });
      
      // Wenn kein Benutzer gefunden wurde
      if (!user) {
        return false;
      }
      
      // Prüfe, ob das Token gültig ist
      return user.isResetTokenValid(token);
    } catch (error) {
      this.logger.error('Error in AuthService.validateResetToken', { error });
      return false;
    }
  }

  /**
   * Setzt ein Passwort zurück
   * 
   * @param resetPasswordDto - Passwort-Zurücksetzungsdaten
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto, 
    options?: ServiceOptions
  ): Promise<{ success: boolean }> {
    try {
      // Validiere die Eingabedaten
      const schema = {
        token: { type: 'string', minLength: 10, required: true },
        password: { type: 'string', minLength: 8, required: true },
        confirmPassword: { type: 'string', minLength: 8, required: true }
      };
      
      const { isValid, errors } = this.validator.validate(resetPasswordDto, schema);
      
      if (!isValid) {
        throw this.errorHandler.createValidationError('Invalid reset password data', errors);
      }
      
      // Prüfe, ob die Passwörter übereinstimmen
      if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
        throw this.errorHandler.createValidationError(
          'Passwords do not match',
          ['Password and confirmation do not match']
        );
      }
      
      // Suche einen Benutzer mit diesem Reset-Token
      const user = await this.userRepository.findOneByCriteria({ resetToken: resetPasswordDto.token });
      
      // When user is not found or token is invalid
      if (!user || !user.resetToken || resetPasswordDto.token !== user.resetToken) {
        throw this.errorHandler.createUnauthorizedError('Invalid or expired token');
      }
      
      // Hashe das neue Passwort
      const hashedPassword = await this.hashPassword(resetPasswordDto.password || '');
      
      // Ändere das Passwort und lösche das Reset-Token
      const updatedUser = user.changePassword(hashedPassword);
      await this.userRepository.update(user.id, updatedUser);
      
      // Widerrufe alle vorhandenen Refresh-Tokens des Benutzers
      await this.refreshTokenRepository.deleteAllForUser(user.id);
      
      // Protokolliere die Passwortänderung
      await this.userRepository.logActivity(
        user.id,
        'PASSWORD_RESET',
        'Password was reset using a reset token',
        options?.context?.ipAddress
      );
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error in AuthService.resetPassword', { error });
      throw error;
    }
  }

  /**
   * Führt den Logout eines Benutzers durch
   * 
   * @param userId - Benutzer-ID
   * @param logoutDto - Logout-Daten (optional)
   * @param options - Service-Optionen
   * @returns Logout-Ergebnis
   */
  async logout(
    userId: number, 
    logoutDto?: { refreshToken: string; allDevices?: boolean }, 
    options?: ServiceOptions
  ): Promise<{ success: boolean; tokenCount: number }> {
    try {
      let tokenCount = 0;
      
      // Wenn ein spezifisches Token angegeben wurde, widerrufe nur dieses
      if (logoutDto?.refreshToken) {
        const token = await this.refreshTokenRepository.findByToken(logoutDto.refreshToken);
        
        if (token && token.userId === userId) {
          await this.revokeRefreshToken(
            logoutDto.refreshToken,
            options?.context?.ipAddress,
            'Logout'
          );
          tokenCount = 1;
        }
      } else {
        // Ansonsten widerrufe alle Tokens des Benutzers
        tokenCount = await this.revokeUserTokens(userId, options?.context?.ipAddress);
      }
      
      // Protokolliere den Logout
      await this.userRepository.logActivity(
        userId,
        'LOGOUT',
        `User logged out, ${tokenCount} token(s) revoked`,
        options?.context?.ipAddress
      );
      
      return { success: true, tokenCount };
    } catch (error) {
      this.logger.error('Error in AuthService.logout', { error, userId });
      throw error;
    }
  }

  /**
   * Überprüft, ob ein Benutzer authentifiziert ist
   * 
   * @param token - Access-Token
   * @param options - Service-Optionen
   * @returns Authentifizierungsstatus
   */
  async verifyToken(token: string, options?: ServiceOptions): Promise<{ valid: boolean; userId?: number; }> {
    try {
      if (!token) {
        return { valid: false };
      }
      
      // Verifiziere JWT-Token
      try {
        const decoded = jwt.verify(token, this.jwtSecret) as any;
        
        // Überprüfe, ob die Nutzlast gültig ist
        if (!decoded || !decoded.sub) {
          return { valid: false };
        }
        
        // Hole Benutzer-ID aus Token
        const userId = parseInt(decoded.sub, 10);
        
        // Überprüfe, ob der Benutzer existiert und aktiv ist
        const user = await this.userRepository.findById(userId);
        
        if (!user || !user.isActive()) {
          return { valid: false };
        }
        
        return { valid: true, userId };
      } catch (error) {
        this.logger.debug('Token verification failed', { error });
        return { valid: false };
      }
    } catch (error) {
      this.logger.error('Error in AuthService.verifyToken', { error });
      return { valid: false };
    }
  }

  /**
   * Überprüft, ob ein Benutzer die angegebene Rolle hat
   * 
   * @param userId - Benutzer-ID
   * @param role - Zu überprüfende Rolle
   * @param options - Service-Optionen
   * @returns Ob der Benutzer die Rolle hat
   */
  async hasRole(userId: number, role: string, options?: ServiceOptions): Promise<boolean> {
    try {
      // Hole Benutzer
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return false;
      }
      
      // Überprüfe Rolle
      return user.role === role;
    } catch (error) {
      this.logger.error('Error in AuthService.hasRole', { error, userId, role });
      return false;
    }
  }

  /**
   * Generiert ein Token für das Zurücksetzen des Passworts (nur für Tests)
   * 
   * @param email - E-Mail-Adresse
   * @returns Token und Ablaufzeitpunkt
   */
  async getResetTokenForTesting(email: string): Promise<{ token: string; expiry: Date }> {
    try {
      // Nur in Nicht-Produktionsumgebungen verfügbar
      if (process.env.NODE_ENV === 'production') {
        throw this.errorHandler.createForbiddenError('This method is not available in production');
      }
      
      // Suche den Benutzer anhand der E-Mail-Adresse
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        throw this.errorHandler.createNotFoundError('User not found');
      }
      
      // Generiere ein Reset-Token
      const token = crypto.randomBytes(40).toString('hex');
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24); // 24 Stunden gültig
      
      // Setze das Reset-Token für den Benutzer
      const updatedUser = user.setResetToken(token, 24);
      await this.userRepository.update(user.id, updatedUser);
      
      this.logger.warn('Generated reset token for testing', { email, token });
      
      return { token, expiry };
    } catch (error) {
      this.logger.error('Error in AuthService.getResetTokenForTesting', { error, email });
      throw error;
    }
  }

  /**
   * Generiert ein Access Token für einen Benutzer
   * 
   * @param user - Benutzer
   * @returns JWT Access Token
   */
  private generateAccessToken(user: any): string {
    // Erstelle Payload für das JWT
    const payload = {
      sub: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.accessTokenExpiry,
      // Add required claims for standard JWT validation
      iss: 'rising-bsm',
      aud: process.env.JWT_AUDIENCE || 'rising-bsm-app'
    };
    
    // Signiere das Token
    return jwt.sign(payload, this.jwtSecret);
  }

  /**
   * Generiert ein Refresh Token für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param expiryDays - Ablaufzeit in Tagen
   * @param ipAddress - IP-Adresse
   * @returns Refresh Token
   */
  private async generateRefreshToken(
    userId: number, 
    expiryDays: number, 
    ipAddress?: string
  ): Promise<any> {
    // Erstelle Ablaufzeitpunkt
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    
    // Erstelle ein zufälliges Token
    const token = crypto.randomBytes(40).toString('hex');
    
    // Speichere das Token in der Datenbank
    const refreshToken = await this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      createdAt: new Date(),
      createdByIp: ipAddress,
      isRevoked: false
    });
    
    return refreshToken;
  }

  /**
   * Widerruft ein Refresh Token
   * 
   * @param token - Token
   * @param ipAddress - IP-Adresse
   * @param reason - Grund
   * @returns Erfolg der Operation
   */
  private async revokeRefreshToken(token: string, ipAddress?: string, reason?: string): Promise<boolean> {
    try {
      // Suche das Token
      const refreshToken = await this.refreshTokenRepository.findByToken(token);
      
      if (!refreshToken || refreshToken.isRevoked) {
        return false;
      }
      
      // Setze Widerrufsinformationen
      const updatedToken = {
        ...refreshToken,
        revokedAt: new Date(),
        revokedByIp: ipAddress,
        isRevoked: true,
        // Optionales Ersatztoken
        ...(reason ? { replacedByToken: reason } : {})
      };
      
      // Aktualisiere das Token
      await this.refreshTokenRepository.update(token, updatedToken);
      
      return true;
    } catch (error) {
      this.logger.error('Error in AuthService.revokeRefreshToken', { error, token });
      return false;
    }
  }

  /**
   * Widerruft alle Tokens eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param ipAddress - IP-Adresse
   * @returns Anzahl der widerrufenen Tokens
   */
  private async revokeUserTokens(userId: number, ipAddress?: string): Promise<number> {
    try {
      // Hole alle aktiven Tokens des Benutzers
      const activeTokens = await this.refreshTokenRepository.findByUserId(userId);
      const nonRevokedTokens = activeTokens.filter(token => !token.isRevoked);
      
      // Wenn keine nicht-widerrufenen Tokens vorhanden sind
      if (nonRevokedTokens.length === 0) {
        return 0;
      }
      
      // Widerrufe jedes Token
      for (const token of nonRevokedTokens) {
        await this.revokeRefreshToken(token.token, ipAddress, 'Revoked on logout');
      }
      
      return nonRevokedTokens.length;
    } catch (error) {
      this.logger.error('Error in AuthService.revokeUserTokens', { error, userId });
      return 0;
    }
  }

  /**
   * Plant die regelmäßige Bereinigung abgelaufener Tokens
   */
  private scheduleTokenCleanup(): void {
    // Bereinige abgelaufene Tokens bei Initialisierung
    this.cleanupExpiredTokens();
    
    // Plane die Bereinigung alle 24 Stunden
    setInterval(() => this.cleanupExpiredTokens(), 24 * 60 * 60 * 1000);
  }

  /**
   * Bereinigt abgelaufene Tokens
   */
  private async cleanupExpiredTokens(): Promise<void> {
    try {
      const deletedCount = await this.refreshTokenRepository.deleteExpiredTokens();
      
      if (deletedCount > 0) {
        this.logger.info(`Cleaned up ${deletedCount} expired refresh tokens`);
      }
    } catch (error) {
      this.logger.error('Error in AuthService.cleanupExpiredTokens', { error });
    }
  }

  /**
   * Hasht ein Passwort
   * 
   * @param password - Zu hashendes Passwort
   * @returns Gehashtes Passwort
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcryptjs.hash(password, saltRounds);
  }

  /**
   * Überprüft ein Passwort
   * 
   * @param plainPassword - Klartextpasswort
   * @param hashedPassword - Gehashtes Passwort
   * @returns Ob das Passwort gültig ist
   */
  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcryptjs.compare(plainPassword, hashedPassword);
  }

  /**
   * Registriert einen neuen Benutzer
   * 
   * @param registerDto - Registrierungsdaten
   * @param options - Service-Optionen
   * @returns Registrierungsergebnis
   */
  async register(registerDto: RegisterDto, options?: ServiceOptions): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      // Validiere Eingabedaten
      const schema = {
        name: { type: 'string', minLength: 2, required: true },
        email: { type: 'string', format: 'email', required: true },
        password: { type: 'string', minLength: 8, required: true },
        role: { type: 'string', enum: ['user', 'admin', 'employee'], required: false },
        terms: { type: 'boolean', required: true }
      };
      
      const { isValid, errors } = this.validator.validate(registerDto, schema);
      
      if (!isValid) {
        throw this.errorHandler.createValidationError('Invalid registration data', errors);
      }
      
      // Prüfe, ob E-Mail bereits existiert
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      
      if (existingUser) {
        throw this.errorHandler.createConflictError('E-Mail address is already in use');
      }
      
      // Passwort hashen
      const hashedPassword = await this.hashPassword(registerDto.password);
      
      // Import or ensure UserRole and UserStatus enums are available
      // This assumes these are imported at the top of the file

      // Benutzer erstellen
      const user = await this.userRepository.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role || UserRole.USER,
        status: UserStatus.ACTIVE,
        phone: registerDto.phone,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Aktivität protokollieren
      await this.userRepository.logActivity(
        user.id,
        'REGISTER',
        'User registered',
        options?.context?.ipAddress
      );
      
      return { 
        success: true, 
        message: 'Registration successful', 
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      this.logger.error('Error in AuthService.register', { error, email: registerDto.email });
      throw error;
    }
  }
}