'use client';

// Export client-side service by default
export * from './NotificationService';

// Export server-side service
export { NotificationService as NotificationServiceServer } from './NotificationService.server';
