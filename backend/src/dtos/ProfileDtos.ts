/**
 * Data transfer object for updating user profile
 */
export interface UpdateProfileDto {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/**
 * Data transfer object for changing user password
 */
export interface ChangeMyPasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Filter parameters for user activity logs
 */
export interface ActivityLogFilterParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}