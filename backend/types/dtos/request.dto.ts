/**
 * Contact request-related DTOs
 */
export interface ContactRequestCreateDto {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
}

export interface ContactRequestResponseDto {
  id: number;
  name: string;
  email: string;
  serviceLabel: string;
  formattedDate: string;
  status: string;
  statusClass: string;
}

export interface ContactRequestDetailDto extends ContactRequestResponseDto {
  phone: string;
  message: string;
  notes: RequestNoteDto[];
}

export interface RequestNoteDto {
  id: number;
  text: string;
  formattedDate: string;
  benutzer: string;
}

export interface RequestFilterDto {
  status?: string;
  service?: string;
  date?: string;
  search?: string;
}

export interface RequestStatusUpdateDto {
  id: number;
  status: string;
  note?: string;
}

export interface RequestNoteCreateDto {
  note: string;
}
