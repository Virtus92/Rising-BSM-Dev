import api from '../axios';
import { User } from '../../types';

export const authService = {
  async login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  async getCurrentUser() {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
  
  async updatePassword(currentPassword: string, newPassword: string) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};