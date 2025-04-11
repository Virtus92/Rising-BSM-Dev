/**
 * API-Client für Benutzerverwaltung
 */
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto
} from '@/domain/dtos/UserDtos';
import { ApiClient, ApiResponse, apiClient } from '@/infrastructure/clients/ApiClient';

// API-URL für Benutzer
const USERS_API_URL = '/api/users';

/**
 * Client für Benutzeranfragen
 */
export class UserClient {
  /**
   * Singleton-Instanz des API-Clients
   */
  private static apiClient = apiClient;

  /**
   * Holt alle Benutzer mit optionaler Filterung
   * 
   * @param params - Optionale Filterparameter
   * @returns API-Antwort
   */
  static async getUsers(params: Record<string, any> = {}): Promise<ApiResponse<UserResponseDto[]>> {
    try {
      // Parameter in Query-String umwandeln
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      const url = `${USERS_API_URL}${queryString ? `?${queryString}` : ''}`;
      
      return await UserClient.apiClient.get(url);
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: []
      };
    }
  }
  
  /**
   * Holt einen Benutzer anhand der ID
   * 
   * @param id - Benutzer-ID
   * @returns API-Antwort
   */
  static async getUserById(id: number | string): Promise<ApiResponse<UserResponseDto>> {
    try {
      return await UserClient.apiClient.get(`${USERS_API_URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }
  
  /**
   * Holt den aktuellen eingeloggten Benutzer
   * 
   * @returns API-Antwort
   */
  static async getCurrentUser(): Promise<ApiResponse<UserResponseDto>> {
    try {
      return await UserClient.apiClient.get(`${USERS_API_URL}/me`);
    } catch (error) {
      console.error('Error fetching current user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }
  
  /**
   * Erstellt einen neuen Benutzer
   * 
   * @param data - Benutzerdaten
   * @returns API-Antwort
   */
  static async createUser(data: CreateUserDto): Promise<ApiResponse<UserResponseDto>> {
    try {
      return await UserClient.apiClient.post(USERS_API_URL, data);
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }
  
  /**
   * Aktualisiert einen Benutzer
   * 
   * @param id - Benutzer-ID
   * @param data - Aktualisierungsdaten
   * @returns API-Antwort
   */
  static async updateUser(id: number | string, data: UpdateUserDto): Promise<ApiResponse<UserResponseDto>> {
    try {
      return await UserClient.apiClient.put(`${USERS_API_URL}/${id}`, data);
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }
  
  /**
   * Aktualisiert den aktuellen Benutzer
   * 
   * @param data - Aktualisierungsdaten
   * @returns API-Antwort
   */
  static async updateCurrentUser(data: UpdateUserDto): Promise<ApiResponse<UserResponseDto>> {
    try {
      return await UserClient.apiClient.put(`${USERS_API_URL}/me`, data);
    } catch (error) {
      console.error('Error updating current user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }
  
  /**
   * Löscht einen Benutzer
   * 
   * @param id - Benutzer-ID
   * @returns API-Antwort
   */
  static async deleteUser(id: number | string): Promise<ApiResponse<void>> {
    try {
      return await UserClient.apiClient.delete(`${USERS_API_URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }
  
  /**
   * Setzt das Passwort eines Benutzers zurück (Admin-Funktion)
   * 
   * @param id - Benutzer-ID
   * @returns API-Antwort mit neuem Passwort
   */
  static async resetUserPassword(id: number | string): Promise<ApiResponse<{ password: string }>> {
    try {
      return await UserClient.apiClient.post(`${USERS_API_URL}/${id}/reset-password`, {});
    } catch (error) {
      console.error(`Error resetting password for user with ID ${id}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }
}