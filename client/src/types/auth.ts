export interface LoginCredentials {
    email: string;
    password: string;
    remember?: boolean;
  }
  
  export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
  }
  
  export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'manager' | 'mitarbeiter';
    initials?: string;
  }
  
  export interface LoginResponse {
    success: boolean;
    user: User;
    redirect?: string;
    message?: string;
  }
  
  export interface PasswordResetRequest {
    email: string;
  }
  
  export interface PasswordResetFormData {
    password: string;
    confirmPassword: string;
    token: string;
  }