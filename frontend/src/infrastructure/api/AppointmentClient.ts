/**
 * API-Client für Terminverwaltung
 */
import { 
  CreateAppointmentDto, 
  UpdateAppointmentDto, 
  AppointmentResponseDto,
  StatusUpdateDto
} from '@/domain/dtos/AppointmentDtos';
import ApiClient, { ApiResponse, ApiRequestError } from '@/infrastructure/clients/ApiClient';

// API-URL für Termine
const APPOINTMENTS_API_URL = '/api/appointments';

/**
 * Client für Terminanfragen
 */
export class AppointmentClient {
  /**
   * Initialize ApiClient if needed
   */
  // API initialization is now handled by ApiClient

  /**
   * Holt alle Termine mit optionaler Filterung
   * 
   * @param params - Optionale Filterparameter
   * @returns API-Antwort
   */
  static async getAppointments(params: Record<string, any> = {}): Promise<ApiResponse<AppointmentResponseDto[]>> {
    try {
      // Parameter in Query-String umwandeln
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      // Removed explicit initialization
      const queryString = queryParams.toString();
      const url = `${APPOINTMENTS_API_URL}${queryString ? `?${queryString}` : ''}`;
      
      return await ApiClient.get(url);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch appointments',
        500
      );
    }
  }
  
  /**
   * Holt einen Termin anhand der ID
   * 
   * @param id - Termin-ID
   * @returns API-Antwort
   */
  static async getAppointmentById(id: number | string): Promise<ApiResponse<AppointmentResponseDto>> {
    try {
      return await ApiClient.get(`${APPOINTMENTS_API_URL}/${id}`);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch appointment with ID ${id}`,
        500
      );
    }
  }
  
  /**
   * Erstellt einen neuen Termin
   * 
   * @param data - Termindaten
   * @returns API-Antwort
   */
  static async createAppointment(data: CreateAppointmentDto): Promise<ApiResponse<AppointmentResponseDto>> {
    try {
      return await ApiClient.post(APPOINTMENTS_API_URL, data);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to create appointment',
        500
      );
    }
  }
  
  /**
   * Aktualisiert einen Termin
   * 
   * @param id - Termin-ID
   * @param data - Aktualisierungsdaten
   * @returns API-Antwort
   */
  static async updateAppointment(id: number | string, data: UpdateAppointmentDto): Promise<ApiResponse<AppointmentResponseDto>> {
    try {
      return await ApiClient.put(`${APPOINTMENTS_API_URL}/${id}`, data);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to update appointment with ID ${id}`,
        500
      );
    }
  }
  
  /**
   * Löscht einen Termin
   * 
   * @param id - Termin-ID
   * @returns API-Antwort
   */
  static async deleteAppointment(id: number | string): Promise<ApiResponse<void>> {
    try {
      return await ApiClient.delete(`${APPOINTMENTS_API_URL}/${id}`);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to delete appointment with ID ${id}`,
        500
      );
    }
  }
  
  /**
   * Aktualisiert den Status eines Termins
   * 
   * @param id - Termin-ID
   * @param statusData - Statusdaten
   * @returns API-Antwort
   */
  static async updateAppointmentStatus(id: number | string, statusData: StatusUpdateDto): Promise<ApiResponse<AppointmentResponseDto>> {
    try {
      return await ApiClient.put(`${APPOINTMENTS_API_URL}/${id}/status`, statusData);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to update status for appointment with ID ${id}`,
        500
      );
    }
  }
  
  /**
   * Fügt eine Notiz zu einem Termin hinzu
   * 
   * @param id - Termin-ID
   * @param note - Notiz
   * @returns API-Antwort
   */
  static async addAppointmentNote(id: number | string, note: string): Promise<ApiResponse<any>> {
    try {
      return await ApiClient.post(`${APPOINTMENTS_API_URL}/${id}/notes`, { note });
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to add note to appointment with ID ${id}`,
        500
      );
    }
  }
  
  /**
   * Holt Termine für einen Kunden
   * 
   * @param customerId - Kunden-ID
   * @returns API-Antwort
   */
  static async getAppointmentsByCustomer(customerId: number | string): Promise<ApiResponse<AppointmentResponseDto[]>> {
    try {
      return await ApiClient.get(`${APPOINTMENTS_API_URL}/by-customer/${customerId}`);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch appointments for customer with ID ${customerId}`,
        500
      );
    }
  }
  
  /**
   * Holt Termine für ein Projekt
   * 
   * @param projectId - Projekt-ID
   * @returns API-Antwort
   */
  static async getAppointmentsByProject(projectId: number | string): Promise<ApiResponse<AppointmentResponseDto[]>> {
    try {
      return await ApiClient.get(`${APPOINTMENTS_API_URL}/by-project/${projectId}`);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch appointments for project with ID ${projectId}`,
        500
      );
    }
  }
  
  /**
   * Holt Termine für einen Datumsbereich
   * 
   * @param startDate - Startdatum
   * @param endDate - Enddatum
   * @returns API-Antwort
   */
  static async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<ApiResponse<AppointmentResponseDto[]>> {
    try {
      return await ApiClient.get(`${APPOINTMENTS_API_URL}/by-date-range?startDate=${startDate}&endDate=${endDate}`);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch appointments for date range ${startDate} to ${endDate}`,
        500
      );
    }
  }
  
  /**
   * Holt bevorstehende Termine
   * 
   * @param limit - Optionale Begrenzung der Anzahl
   * @returns API-Antwort
   */
  static async getUpcomingAppointments(limit?: number): Promise<ApiResponse<AppointmentResponseDto[]>> {
    try {
      const queryParams = limit ? `?limit=${limit}` : '';
      return await ApiClient.get(`${APPOINTMENTS_API_URL}/upcoming${queryParams}`);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch upcoming appointments',
        500
      );
    }
  }
}