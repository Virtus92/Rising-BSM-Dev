/**
 * Appointment-related DTOs
 */
export interface AppointmentCreateDto {
  titel: string;
  kunde_id?: number | null;
  projekt_id?: number | null;
  termin_datum: string;
  termin_zeit: string;
  dauer?: number;
  ort?: string | null;
  beschreibung?: string | null;
  status?: string;
}

export interface AppointmentUpdateDto extends Partial<AppointmentCreateDto> {}

export interface AppointmentResponseDto {
  id: number;
  titel: string;
  kunde_id: number | null;
  kunde_name: string;
  projekt_id: number | null;
  projekt_titel: string;
  termin_datum: Date;
  dateFormatted: string;
  timeFormatted: string;
  dauer: number;
  ort: string;
  status: string;
  statusLabel: string;
  statusClass: string;
}

export interface AppointmentDetailDto extends AppointmentResponseDto {
  beschreibung: string;
  notes: AppointmentNoteDto[];
}

export interface AppointmentNoteDto {
  id: number;
  text: string;
  formattedDate: string;
  benutzer: string;
}

export interface AppointmentSummaryDto {
  id: number;
  titel: string;
  datum: string;
  status: string;
  statusLabel: string;
  statusClass: string;
}

export interface AppointmentFilterDto {
  status?: string;
  date?: string;
  search?: string;
}

export interface AppointmentStatusUpdateDto {
  id: number;
  status: string;
  note?: string;
}

export interface AppointmentNoteCreateDto {
  note: string;
}
