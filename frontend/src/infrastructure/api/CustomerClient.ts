/**
 * API-Client für Kundenverwaltung
 */
import { 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CustomerResponseDto
} from '@/domain/dtos/CustomerDtos';
import ApiClient from '@/infrastructure/clients/ApiClient';
import type { ApiResponse } from '@/infrastructure/clients/ApiClient';

// API-URL für Kunden
const CUSTOMERS_API_URL = '/api/customers';

/**
 * Hilfsfunktion zur Behandlung von API-Fehlern
 * 
 * @param error - Fehler
 * @param defaultMessage - Standardnachricht
 * @returns Formatierte API-Antwort mit Fehler
 */
function handleApiError(error: any, defaultMessage: string): ApiResponse<any> {
  console.error(defaultMessage, error);
  return {
    success: false,
    message: error instanceof Error ? error.message : defaultMessage,
    data: null
  };
}

/**
 * Client für Kundenanfragen
 */
export class CustomerClient {
  /**
   * Initialize ApiClient if needed
   */
  private static apiClientInitialized = false;
  
  private static initApiClient() {
    if (!this.apiClientInitialized) {
      ApiClient.initialize({ baseUrl: '/api' });
      this.apiClientInitialized = true;
    }
  }

  /**
   * Holt alle Kunden mit optionaler Filterung
   * 
   * @param params - Optionale Filterparameter
   * @returns API-Antwort
   */
  static async getCustomers(params: Record<string, any> = {}): Promise<ApiResponse<CustomerResponseDto[]>> {
    try {
      // Parameter in Query-String umwandeln
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      CustomerClient.initApiClient();
      const queryString = queryParams.toString();
      const url = `${CUSTOMERS_API_URL}${queryString ? `?${queryString}` : ''}`;
      
      return await ApiClient.get(url);
    } catch (error) {
      return handleApiError(error, 'Fehler beim Abrufen der Kunden');
    }
  }
  
  /**
   * Holt einen Kunden anhand der ID
   * 
   * @param id - Kunden-ID
   * @returns API-Antwort
   */
  static async getCustomerById(id: number | string): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      CustomerClient.initApiClient();
      return await ApiClient.get(`${CUSTOMERS_API_URL}/${id}`);
    } catch (error) {
      return handleApiError(error, `Fehler beim Abrufen des Kunden mit ID ${id}`);
    }
  }
  
  /**
   * Erstellt einen neuen Kunden
   * 
   * @param data - Kundendaten
   * @returns API-Antwort
   */
  static async createCustomer(data: CreateCustomerDto): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      CustomerClient.initApiClient();
      return await ApiClient.post(CUSTOMERS_API_URL, data);
    } catch (error) {
      return handleApiError(error, 'Fehler beim Erstellen des Kunden');
    }
  }
  
  /**
   * Aktualisiert einen Kunden
   * 
   * @param id - Kunden-ID
   * @param data - Aktualisierungsdaten
   * @returns API-Antwort
   */
  static async updateCustomer(id: number | string, data: UpdateCustomerDto): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      CustomerClient.initApiClient();
      return await ApiClient.put(`${CUSTOMERS_API_URL}/${id}`, data);
    } catch (error) {
      return handleApiError(error, `Fehler beim Aktualisieren des Kunden mit ID ${id}`);
    }
  }
  
  /**
   * Löscht einen Kunden
   * 
   * @param id - Kunden-ID
   * @returns API-Antwort
   */
  static async deleteCustomer(id: number | string): Promise<ApiResponse<void>> {
    try {
      CustomerClient.initApiClient();
      return await ApiClient.delete(`${CUSTOMERS_API_URL}/${id}`);
    } catch (error) {
      return handleApiError(error, `Fehler beim Löschen des Kunden mit ID ${id}`);
    }
  }
  
  /**
   * Sucht nach Kunden basierend auf einem Suchbegriff
   * 
   * @param query - Suchbegriff
   * @returns API-Antwort
   */
  static async searchCustomers(query: string): Promise<ApiResponse<CustomerResponseDto[]>> {
    try {
      CustomerClient.initApiClient();
      return await ApiClient.get(`${CUSTOMERS_API_URL}/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      return handleApiError(error, `Fehler bei der Suche nach Kunden mit Abfrage "${query}"`);
    }
  }
}