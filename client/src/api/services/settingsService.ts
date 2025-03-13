import api from '../axios';

export const settingsService = {
  async getUserSettings() {
    const response = await api.get('/settings');
    return response.data;
  },
  
  async updateUserSettings(settings: {
    sprache?: string;
    dark_mode?: boolean;
    benachrichtigungen_email?: boolean;
    benachrichtigungen_push?: boolean;
    benachrichtigungen_intervall?: string;
  }) {
    const response = await api.post('/settings/update', settings);
    return response.data;
  },
  
  async getSystemSettings() {
    const response = await api.get('/settings/system');
    return response.data;
  },
  
  async updateSystemSettings(settings: Record<string, any>) {
    const response = await api.post('/settings/system/update', { settings });
    return response.data;
  },
  
  async getBackupSettings() {
    const response = await api.get('/settings/backup');
    return response.data;
  },
  
  async updateBackupSettings(settings: {
    automatisch?: boolean;
    intervall?: string;
    zeit?: string;
    aufbewahrung?: number;
  }) {
    const response = await api.post('/settings/backup/update', settings);
    return response.data;
  },
  
  async triggerManualBackup() {
    const response = await api.post('/settings/backup/trigger');
    return response.data;
  }
};