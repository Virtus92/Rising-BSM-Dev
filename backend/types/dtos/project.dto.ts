/**
 * Project-related DTOs
 */
export interface ProjectCreateDto {
  titel: string;
  kunde_id?: number | null;
  dienstleistung_id?: number | null;
  start_datum: string;
  end_datum?: string | null;
  betrag?: number | null;
  beschreibung?: string | null;
  status?: string;
}

export interface ProjectUpdateDto extends Partial<ProjectCreateDto> {}

export interface ProjectResponseDto {
  id: number;
  titel: string;
  kunde_id: number | null;
  kunde_name: string;
  dienstleistung_id: number | null;
  dienstleistung: string;
  start_datum: string;
  end_datum: string;
  betrag: number | null;
  status: string;
  statusLabel: string;
  statusClass: string;
}

export interface ProjectDetailDto extends ProjectResponseDto {
  beschreibung: string;
  appointments: AppointmentSummaryDto[];
  notes: ProjectNoteDto[];
}

export interface ProjectNoteDto {
  id: number;
  text: string;
  formattedDate: string;
  benutzer: string;
}

export interface ProjectSummaryDto {
  id: number;
  titel: string;
  datum: string;
  status: string;
  statusLabel: string;
  statusClass: string;
}

export interface ProjectFilterDto {
  status?: string;
  kunde_id?: number;
  search?: string;
}

export interface ProjectStatusUpdateDto {
  id: number;
  status: string;
  note?: string;
}

export interface ProjectNoteCreateDto {
  note: string;
}

// Referenced from other files
interface AppointmentSummaryDto {
  id: number;
  titel: string;
  datum: string;
  status: string;
  statusLabel: string;
  statusClass: string;
}
