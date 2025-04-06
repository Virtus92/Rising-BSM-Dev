/**
 * Interface für den Profile-Service
 * Verwaltet Benutzerprofileinstellungen
 */
export interface IProfileService {
  /**
   * Holt das Profil eines Benutzers
   */
  getProfile(userId: number): Promise<{
    user: any;
    settings: any;
    activities: any[];
  }>;

  /**
   * Aktualisiert das Profil eines Benutzers
   */
  updateProfile(userId: number, data: any): Promise<any>;

  /**
   * Aktualisiert die Profileinstellungen eines Benutzers
   */
  updateSettings(userId: number, settings: any): Promise<any>;

  /**
   * Ändert das Profilbild eines Benutzers
   */
  updateProfilePicture(userId: number, pictureUrl: string): Promise<any>;

  /**
   * Holt die letzten Aktivitäten eines Benutzers
   */
  getUserActivities(userId: number, limit?: number): Promise<any[]>;

  /**
   * Fügt eine Benutzeraktivität hinzu
   */
  logUserActivity(userId: number, activity: string, ipAddress?: string): Promise<void>;

  /**
   * Validiert Profildaten
   */
  validateProfileData(data: any): { isValid: boolean; errors?: any };

  /**
   * Validiert Einstellungsdaten
   */
  validateSettingsData(data: any): { isValid: boolean; errors?: any };
}
