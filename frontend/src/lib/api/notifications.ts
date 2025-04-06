/**
 * Notifications API-Client
 * Enthält alle Funktionen für Benachrichtigungen
 */
import { get, post, put, del, ApiResponse } from './config';

/**
 * Benachrichtigungstypen
 */
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  SYSTEM = 'system',
  TASK = 'task',
  APPOINTMENT = 'appointment',
  PROJECT = 'project',
  MESSAGE = 'message'
}

/**
 * Benachrichtigungsmodell
 */
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hole Benachrichtigungen für den aktuellen Benutzer
 */
export async function getNotifications(
  options: { limit?: number; page?: number; unreadOnly?: boolean } = {}
): Promise<ApiResponse<Notification[]>> {
  const params = new URLSearchParams();
  
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.page) params.append('page', options.page.toString());
  if (options.unreadOnly) params.append('unreadOnly', 'true');
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return get(`/notifications${queryString}`);
}

/**
 * Hole eine einzelne Benachrichtigung nach ID
 */
export async function getNotification(id: number): Promise<ApiResponse<Notification>> {
  return get(`/notifications/${id}`);
}

/**
 * Markiere eine Benachrichtigung als gelesen
 */
export async function markNotificationAsRead(id: number): Promise<ApiResponse<Notification>> {
  return put(`/notifications/${id}/read`, {});
}

/**
 * Markiere alle Benachrichtigungen als gelesen
 */
export async function markAllNotificationsAsRead(): Promise<ApiResponse<{ count: number }>> {
  return put('/notifications/read-all', {});
}

/**
 * Lösche eine Benachrichtigung
 */
export async function deleteNotification(id: number): Promise<ApiResponse<{ success: boolean }>> {
  return del(`/notifications/${id}`);
}

/**
 * Lösche alle Benachrichtigungen
 */
export async function deleteAllNotifications(): Promise<ApiResponse<{ count: number }>> {
  return del('/notifications/all');
}

/**
 * Erstelle eine neue Benachrichtigung (nur mit Admin-Rechten)
 */
export async function createNotification(
  notification: {
    userId: number;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
  }
): Promise<ApiResponse<Notification>> {
  return post('/notifications', notification);
}
