import { get, post, put, patch, del, ApiResponse } from '@/lib/api/config';

/**
 * Kundendaten-Typ
 */
export interface CustomerType {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  notes?: string;
  newsletter: boolean;
  status: string;
  statusLabel?: string;
  statusClass?: string;
  type: string;
  typeLabel?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Typ für Kundendetails mit Projekten, Terminen und Notizen
 */
export interface CustomerWithDetails extends Omit<CustomerType, 'notes'> {
  projects?: Array<{
    id: number;
    title: string;
    startDate: string;
    status: string;
    statusLabel: string;
    statusClass: string;
  }>;
  appointments?: Array<{
    id: number;
    title: string;
    appointmentDate: string;
    status: string;
    statusLabel: string;
    statusClass: string;
  }>;
  notes?: string | Array<{
    id: number;
    text: string;
    userName: string;
    formattedDate: string;
    createdAt: string;
  }>;
}

/**
 * Typ für neue Kundendaten beim Erstellen
 */
export interface CustomerCreate {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  notes?: string;
  newsletter?: boolean;
  status?: string;
  type?: string;
}

/**
 * Typ für Filter-Optionen
 */
export interface CustomerFilter {
  status?: string;
  type?: string;
  search?: string;
  city?: string;
  postalCode?: string;
  newsletter?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Typ für Export-Optionen
 */
export interface CustomerExportOptions extends CustomerFilter {
  format: 'csv' | 'excel';
}

/**
 * Ruft eine Liste von Kunden ab
 * @param filters Filter- und Sortieroptionen
 */
export const getCustomers = async (filters?: CustomerFilter): Promise<ApiResponse<CustomerType[]>> => {
  // Filtern der undefined-Werte und Erstellen der Query-Parameter
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
  }
  
  return get<CustomerType[]>(`/customers?${params.toString()}`);
};

/**
 * Ruft einen einzelnen Kunden anhand seiner ID ab
 * @param id Kunden-ID
 */
export const getCustomerById = async (id: number): Promise<ApiResponse<CustomerWithDetails>> => {
  return get<CustomerWithDetails>(`/customers/${id}`);
};

/**
 * Erstellt einen neuen Kunden
 * @param data Kundendaten
 */
export const createCustomer = async (data: CustomerCreate): Promise<ApiResponse<CustomerType>> => {
  return post<CustomerType>('/customers', data);
};

/**
 * Aktualisiert einen bestehenden Kunden
 * @param id Kunden-ID
 * @param data Kundendaten
 */
export const updateCustomer = async (id: number, data: Partial<CustomerCreate>): Promise<ApiResponse<CustomerType>> => {
  return put<CustomerType>(`/customers/${id}`, data);
};

/**
 * Aktualisiert den Status eines Kunden
 * @param id Kunden-ID
 * @param status Neuer Status
 * @param note Optionale Notiz zur Statusänderung
 */
export const updateCustomerStatus = async (
  id: number, 
  status: string, 
  note?: string
): Promise<ApiResponse<{ id: number; status: string; statusLabel: string; }>> => {
  return patch(`/customers/${id}/status`, { status, note });
};

/**
 * Löscht einen Kunden (entweder soft-delete oder hard-delete)
 * @param id Kunden-ID
 * @param mode Löschmodus ('soft' oder 'hard')
 */
export const deleteCustomer = async (
  id: number, 
  mode: 'soft' | 'hard' = 'soft'
): Promise<ApiResponse<{ id: number; success: boolean; }>> => {
  return del(`/customers/${id}?mode=${mode}`);
};

/**
 * Fügt eine Notiz zu einem Kunden hinzu
 * @param id Kunden-ID
 * @param text Notiztext
 */
export const addCustomerNote = async (
  id: number, 
  text: string
): Promise<ApiResponse> => {
  return post(`/customers/${id}/notes`, { text });
};

/**
 * Ruft Statistiken zu Kunden ab
 */
export const getCustomerStatistics = async (): Promise<ApiResponse<{
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  trend: {
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  }
}>> => {
  return get('/customers/statistics');
};

/**
 * Exportiert Kundendaten als CSV oder Excel
 * @param options Export-Optionen
 */
export const exportCustomers = async (options: CustomerExportOptions): Promise<void> => {
  const params = new URLSearchParams();
  
  // Filtern der undefined-Werte und Erstellen der Query-Parameter
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });
  
  // Direkter Browser-Download mit Fetch
  const response = await fetch(`/customers/export?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Export fehlgeschlagen');
  }
  
  // Content-Disposition Header auslesen, um den Dateinamen zu bestimmen
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'kunden-export';
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }
  
  // Dateityp bestimmen
  const contentType = response.headers.get('Content-Type');
  if (contentType?.includes('spreadsheetml')) {
    filename = `${filename}.xlsx`;
  } else {
    filename = `${filename}.csv`;
  }
  
  // Blob erstellen und Download starten
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Aufräumen
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Ruft ähnliche Kunden zu einem bestimmten Kunden ab
 * @param id Kunden-ID
 * @param limit Maximale Anzahl der zurückzugebenden ähnlichen Kunden
 */
export const getSimilarCustomers = async (
  id: number, 
  limit: number = 5
): Promise<ApiResponse<CustomerType[]>> => {
  return get<CustomerType[]>(`/customers/${id}/similar?limit=${limit}`);
};

/**
 * Ruft den Verlauf eines Kunden ab
 * @param id Kunden-ID
 */
export const getCustomerHistory = async (id: number): Promise<ApiResponse<Array<{
  id: number;
  action: string;
  timestamp: string;
  relativeTime: string;
  user: string;
  details: string;
}>>> => {
  return get(`/customers/${id}/history`);
};

/**
 * Ruft Insights zu einem Kunden ab (erweiterte Analysedaten)
 * @param id Kunden-ID
 */
export const getCustomerInsights = async (id: number): Promise<ApiResponse<{
  customer: CustomerType;
  projectStats: {
    total: number;
    byStatus: Record<string, number>;
  };
  appointmentStats: {
    total: number;
    upcoming: number;
  };
  financials: {
    totalRevenue: string;
    averageProjectValue: string;
  };
  activity: {
    recent: Array<{
      action: string;
      date: string;
      by: string;
      details: string;
    }>;
    lastUpdate: string;
  };
}>> => {
  return get(`/customers/${id}/insights`);
};
