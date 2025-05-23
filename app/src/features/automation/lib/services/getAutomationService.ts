/**
 * Get Automation Service Instance
 * 
 * Server-side helper to get the automation service instance
 */

import { getServiceFactory } from '@/core/factories/index.server';
import { IAutomationService } from '@/domain/services/IAutomationService';

/**
 * Get automation service instance
 * 
 * @returns Promise<IAutomationService>
 */
export async function getAutomationService(): Promise<IAutomationService> {
  const factory = getServiceFactory();
  return factory.createAutomationService();
}
