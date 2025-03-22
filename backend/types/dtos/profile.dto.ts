/**
 * Profile-related DTOs
 */
export interface ProfileUpdateDto {
  name: string;
  email?: string;
  telefon?: string;
}

export interface PasswordUpdateDto {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface NotificationSettingsUpdateDto {
  benachrichtigungen_email?: boolean;
  benachrichtigungen_push?: boolean;
  benachrichtigungen_intervall?: string;
}

export interface UserProfileResponseDto {
  user: {
    id: number;
    name: string;
    email: string;
    telefon: string;
    rolle: string;
    profilbild: string | null;
    seit: string;
  };
  settings: {
    sprache: string;
    dark_mode: boolean;
    benachrichtigungen_email: boolean;
    benachrichtigungen_push: boolean;
    benachrichtigungen_intervall: string;
  };
  activity: UserActivityDto[];
}

export interface UserActivityDto {
  type: string;
  ip: string;
  date: string;
}
