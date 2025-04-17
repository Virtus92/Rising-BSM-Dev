import ApiClient from '@/infrastructure/clients/ApiClient';
import { 
  CreateRequestDto, 
  UpdateRequestDto, 
  RequestStatusUpdateDto, 
  ConvertToCustomerDto,
  RequestFilterParamsDto
} from '@/domain/dtos/RequestDtos';

/**
 * Client für den Zugriff auf Kontaktanfragen-API
 */
export class RequestClient {
  private readonly baseUrl = '/requests';
  
  /**
   * Konstruktor
   * 
   * @param ApiClient - API-Client
   */
  constructor(private readonly ApiClient: ApiClient) {}
  
  /**
   * Erstellt eine neue Kontaktanfrage
   * 
   * @param data - Anfragedaten
   * @returns Erstellte Anfrage
   */
  async createRequest(data: CreateRequestDto) {
    const response = await ApiClient.post(this.baseUrl, data);
    return response;
  }
  
  /**
   * Ruft eine Liste von Kontaktanfragen ab
   * 
   * @param filters - Filterparameter
   * @returns Liste von Anfragen mit Paginierung
   */
  async getRequests(filters?: RequestFilterParamsDto) {
    const queryParams = this.buildQueryParams(filters);
    const response = await ApiClient.get(`${this.baseUrl}${queryParams}`);
    return response;
  }
  
  /**
   * Ruft eine Kontaktanfrage nach ID ab
   * 
   * @param id - Anfrage-ID
   * @returns Detaillierte Anfrageinformationen
   */
  async getRequestById(id: number) {
    const response = await ApiClient.get(`${this.baseUrl}/${id}`);
    return response;
  }
  
  /**
   * Aktualisiert eine Kontaktanfrage
   * 
   * @param id - Anfrage-ID
   * @param data - Aktualisierungsdaten
   * @returns Aktualisierte Anfrage
   */
  async updateRequest(id: number, data: UpdateRequestDto) {
    const response = await ApiClient.put(`${this.baseUrl}/${id}`, data);
    return response;
  }
  
  /**
   * Aktualisiert den Status einer Kontaktanfrage
   * 
   * @param id - Anfrage-ID
   * @param data - Status-Update-Daten
   * @returns Aktualisierte Anfrage
   */
  async updateStatus(id: number, data: RequestStatusUpdateDto) {
    const response = await ApiClient.patch(`${this.baseUrl}/${id}/status`, data);
    return response;
  }
  
  /**
   * Löscht eine Kontaktanfrage
   * 
   * @param id - Anfrage-ID
   * @returns Erfolg der Operation
   */
  async deleteRequest(id: number) {
    const response = await ApiClient.delete(`${this.baseUrl}/${id}`);
    return response;
  }
  
  /**
   * Fügt eine Notiz zu einer Kontaktanfrage hinzu
   * 
   * @param id - Anfrage-ID
   * @param text - Notiztext
   * @returns Erstellte Notiz
   */
  async addNote(id: number, text: string) {
    const response = await ApiClient.post(`${this.baseUrl}/${id}/notes`, { text });
    return response;
  }
  
  /**
   * Weist eine Kontaktanfrage einem Benutzer zu
   * 
   * @param id - Anfrage-ID
   * @param userId - Benutzer-ID
   * @param note - Optionale Notiz
   * @returns Aktualisierte Anfrage
   */
  async assignRequest(id: number, userId: number, note?: string) {
    const response = await ApiClient.post(`${this.baseUrl}/${id}/assign`, { userId, note });
    return response;
  }
  
  /**
   * Konvertiert eine Kontaktanfrage in einen Kunden
   * 
   * @param data - Konvertierungsdaten
   * @returns Ergebnis der Konvertierung
   */
  async convertToCustomer(data: ConvertToCustomerDto) {
    const response = await ApiClient.post(`${this.baseUrl}/${data.requestId}/convert`, data);
    return response;
  }
  
  /**
   * Verknüpft eine Kontaktanfrage mit einem bestehenden Kunden
   * 
   * @param requestId - Anfrage-ID
   * @param customerId - Kunden-ID
   * @param note - Optionale Notiz
   * @returns Aktualisierte Anfrage
   */
  async linkToCustomer(requestId: number, customerId: number, note?: string) {
    const response = await ApiClient.post(`${this.baseUrl}/${requestId}/link-customer`, {
      customerId,
      note
    });
    return response;
  }
  
  /**
   * Erstellt einen Termin für eine Kontaktanfrage
   * 
   * @param requestId - Anfrage-ID
   * @param appointmentData - Termindaten
   * @param note - Optionale Notiz
   * @returns Erstellter Termin
   */
  async createAppointment(requestId: number, appointmentData: any, note?: string) {
    const response = await ApiClient.post(`${this.baseUrl}/${requestId}/appointment`, {
      ...appointmentData,
      note
    });
    return response;
  }
  
  /**
   * Ruft Statistiken zu Kontaktanfragen ab
   * 
   * @param period - Zeitraum (week, month, year)
   * @returns Statistiken
   */
  async getStats(period?: string) {
    const query = period ? `?period=${period}` : '';
    const response = await ApiClient.get(`${this.baseUrl}/stats${query}`);
    return response;
  }
  
  /**
   * Baut Abfrageparameter aus Filteroptionen
   * 
   * @param filters - Filterparameter
   * @returns URL-Abfrageparameter
   */
  private buildQueryParams(filters?: RequestFilterParamsDto): string {
    if (!filters) return '';
    
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.service) params.append('service', filters.service);
    if (filters.processorId) params.append('processorId', filters.processorId.toString());
    if (filters.unassigned) params.append('unassigned', 'true');
    if (filters.notConverted) params.append('notConverted', 'true');
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }
}