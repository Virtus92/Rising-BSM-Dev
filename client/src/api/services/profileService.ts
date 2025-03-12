import api from '../axios';

export const profileService = {
  async getUserProfile() {
    const response = await api.get('/profile');
    return response.data;
  },
  
  async updateProfile(data: { name: string; email: string; telefon?: string }) {
    const response = await api.post('/profile/update', data);
    return response.data;
  },
  
  async updatePassword(currentPassword: string, newPassword: string) {
    const response = await api.post('/profile/password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: newPassword
    });
    return response.data;
  },
  
  async updateProfilePicture(formData: FormData) {
    const response = await api.post('/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  async updateNotificationSettings(settings: {
    benachrichtigungen_email?: boolean;
    benachrichtigungen_push?: boolean;
    benachrichtigungen_intervall?: string;
  }) {
    const response = await api.post('/profile/notifications', settings);
    return response.data;
  }
};