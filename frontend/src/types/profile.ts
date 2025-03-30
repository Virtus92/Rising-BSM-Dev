/**
 * Profile-related interfaces
 */

import { UserSettings } from './user';

export interface ProfileResponse {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    profilePicture: string | null;
    createdAt: string;
  };
  settings: UserSettings;
}

export interface ProfileUpdateRequest {
  name: string;
  email?: string;
  phone?: string | null;
}

export interface PasswordUpdateRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfilePictureResponse {
  imagePath: string;
}

export interface ProfileActivity {
  id: number;
  activity: string;
  ipAddress: string;
  timestamp: string;
  formattedDate: string;
}

export interface ProfileActivityResponse {
  activities: ProfileActivity[];
}
