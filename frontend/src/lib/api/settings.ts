import { get, post, put } from './config';

/**
 * Get all system settings
 * @returns {Promise<any>} Promise resolving to settings
 */
export function getSettings() {
  return get('/settings');
}

/**
 * Get a specific setting by key
 * @param {string} key The setting key to retrieve
 * @returns {Promise<any>} Promise resolving to the setting value
 */
export function getSetting(key: string) {
  return get(`/settings/${key}`);
}

/**
 * Update a setting value
 * @param {string} key The setting key to update
 * @param {any} value The new value for the setting
 * @returns {Promise<any>} Promise resolving to the updated setting
 */
export function updateSetting(key: string, value: any) {
  return put(`/settings/${key}`, { value });
}

/**
 * Update multiple settings at once
 * @param {Record<string, any>} settings Object with key-value pairs to update
 * @returns {Promise<any>} Promise resolving to update status
 */
export function updateMultipleSettings(settings: Record<string, any>) {
  return post('/settings', { settings });
}
