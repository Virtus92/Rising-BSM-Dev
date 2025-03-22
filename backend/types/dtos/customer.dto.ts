/**
 * Customer-related DTOs
 */
export interface CustomerCreateDto {
  name: string;
  firma?: string;
  email: string;
  telefon?: string;
  adresse?: string;
  plz?: string;
  ort?: string;
  notizen?: string;
  newsletter?: boolean;
  status?: string;
  kundentyp?: string;
}

export interface CustomerUpdateDto extends Partial<CustomerCreateDto> {}

export interface CustomerResponseDto {
  id: number;
  name: string;
  firma: string;
  email: string;
  telefon: string;
  adresse: string;
  plz: string;
  ort: string;
  status: string;
  statusLabel: string;
  statusClass: string;
  kundentyp: string;
  kundentypLabel: string;
  created_at: string;
}

export interface CustomerDetailDto extends CustomerResponseDto {
  notizen: string;
  newsletter: boolean;
  appointments: AppointmentSummaryDto[];
  projects: ProjectSummaryDto[];
}

export interface CustomerFilterDto {
  status?: string;
  type?: string;
  search?: string;
}

// These are defined in other files but referenced here
interface AppointmentSummaryDto {
  id: number;
  titel: string;
  datum: string;
  status: string;
  statusLabel: string;
  statusClass: string;
}

interface ProjectSummaryDto {
  id: number;
  titel: string;
  datum: string;
  status: string;
  statusLabel: string;
  statusClass: string;
}
