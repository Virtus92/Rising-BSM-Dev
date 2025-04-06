/**
 * Interface für den Settings-Service
 * Verwaltet globale Systemeinstellungen
 */
export interface ISettingsService {
  /**
   * Holt alle Systemeinstellungen
   */
  getAllSettings(): Promise<any[]>;

  /**
   * Holt eine bestimmte Systemeinstellung anhand des Schlüssels
   */
  getSettingByKey(key: string): Promise<any | null>;

  /**
   * Aktualisiert eine Systemeinstellung
   */
  updateSetting(key: string, value: string, description?: string): Promise<any>;

  /**
   * Aktualisiert mehrere Systemeinstellungen auf einmal
   */
  updateMultipleSettings(settings: Array<{ key: string; value: string; description?: string }>): Promise<any[]>;

  /**
   * Erstellt eine neue Systemeinstellung
   */
  createSetting(key: string, value: string, description?: string): Promise<any>;

  /**
   * Löscht eine Systemeinstellung
   */
  deleteSetting(key: string): Promise<boolean>;

  /**
   * Validiert Einstellungsdaten
   */
  validateSettingData(data: { key: string; value: string; description?: string }): { isValid: boolean; errors?: any };
}
