/**
 * Service-related DTOs
 */
export interface ServiceCreateDto {
  name: string;
  beschreibung?: string | null;
  preis_basis: number;
  einheit: string;
  mwst_satz?: number;
  aktiv?: boolean;
}

export interface ServiceUpdateDto extends Partial<ServiceCreateDto> {}

export interface ServiceResponseDto {
  id: number;
  name: string;
  beschreibung: string;
  preis_basis: number;
  einheit: string;
  mwst_satz: number;
  aktiv: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFilterDto {
  status?: string;
  search?: string;
}

export interface ServiceStatusUpdateDto {
  id: number;
  aktiv: boolean;
}
