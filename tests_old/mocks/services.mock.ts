import { cache } from '../../services/cache.service.js';
import notificationService from '../../services/notification.service.js';

// Bereite Cache-Mock vor
export const cacheMock = {
  getOrExecute: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  getStats: jest.fn(),
  cleanup: jest.fn()
};

// Bereite Notification-Service-Mock vor
export const notificationServiceMock = {
  create: jest.fn(),
  getNotifications: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn()
};

// Funktion zum Ersetzen der realen Services mit Mock-Implementierungen
export const mockServices = () => {
  // Cache-Service mocken
  jest.mock('../../services/cache.service', () => ({
    __esModule: true,
    cache: cacheMock,
    default: cacheMock
  }));

  // Notification-Service mocken
  jest.mock('../../services/notification.service', () => ({
    __esModule: true,
    notificationService: notificationServiceMock,
    default: notificationServiceMock
  }));
};