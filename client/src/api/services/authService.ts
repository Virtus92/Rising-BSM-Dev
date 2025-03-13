import api from '../axios';
import { User } from '../../types';

export const authService = {

  async login(username: string, password: string) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    const response = await api.post('/auth/login', 
      { username, password },
      {
        headers: {
          'X-CSRF-Token': csrfToken
        }
      }
    );
    return response.data;
  },
  
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  async getCurrentUser() {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error: any) {
      // Don't log this as an error if it's a 401 - that's expected
      if (error.response && error.response.status === 401) {
        console.log('No authenticated user found - need to login');
      } else {
        console.error('Error fetching current user:', error);
      }
      throw error;  // Still throw so the calling code can handle it
    }
  },
  
  async updatePassword(currentPassword: string, newPassword: string) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};