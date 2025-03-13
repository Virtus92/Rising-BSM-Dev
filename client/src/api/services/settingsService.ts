import api from '../axios';

export const settingsService = {
  async getUserSettings() {
    try {
      const response = await api.get('/settings/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  },
  
  async updateUserSettings(settings: {
    sprache?: string;
    dark_mode?: boolean;
    benachrichtigungen_email?: boolean;
    benachrichtigungen_push?: boolean;
    benachrichtigungen_intervall?: string;
  }) {
    try {
      const response = await api.post('/settings/user', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },
  
  async getSystemSettings() {
    try {
      const response = await api.get('/settings/system');
      return response.data;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  },
  
  async updateSystemSettings(settings: Record<string, any>) {
    try {
      const response = await api.post('/settings/system', { settings });
      return response.data;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  },
  
  async getBackupSettings() {
    try {
      const response = await api.get('/settings/backup');
      return response.data;
    } catch (error) {
      console.error('Error fetching backup settings:', error);
      throw error;
    }
  },
  
  async updateBackupSettings(settings: {
    automatisch?: boolean;
    intervall?: string;
    zeit?: string;
    aufbewahrung?: number;
  }) {
    try {
      const response = await api.post('/settings/backup', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating backup settings:', error);
      throw error;
    }
  },
  
  async triggerManualBackup() {
    try {
      const response = await api.post('/settings/backup/trigger');
      return response.data;
    } catch (error) {
      console.error('Error triggering manual backup:', error);
      throw error;
    }
  }
};