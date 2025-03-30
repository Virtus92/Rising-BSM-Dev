/**
 * User-related interfaces
 */

export type UserRole = 'admin' | 'manager' | 'mitarbeiter' | 'benutzer';
export type UserStatus = 'aktiv' | 'inaktiv' | 'gesperrt';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  roleLabel: string;
  status: UserStatus;
  statusLabel: string;
  statusClass: string;
  initials: string;
  profilePicture: string | null;
  createdAt: string;
}

export interface UserActivity {
  id: number;
  activity: string;
  activityLabel: string;
  ipAddress: string;
  timestamp: string;
  formattedDate: string;
}

export interface UserSettings {
  language: 'de' | 'en';
  darkMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationInterval: 'immediate' | 'daily' | 'weekly';
}

export interface UserWithDetails extends User {
  activity: UserActivity[];
  settings: UserSettings;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  password?: string;
  phone?: string | null;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserStatusUpdate {
  status: UserStatus;
}

export interface UserQueryParams {
  status?: UserStatus;
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
}
