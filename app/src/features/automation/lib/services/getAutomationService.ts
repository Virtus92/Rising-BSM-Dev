/**
 * Service factory helpers for automation feature
 */

import { getAutomationService as getAutomationServiceFromFactory } from '@/core/factories/serviceFactory.server';
import { IAutomationService } from '@/domain/services/IAutomationService';

/**
 * Gets the automation service instance
 * FIXED: Returns Promise to ensure service is properly initialized
 */
export async function getAutomationService(): Promise<IAutomationService> {
  try {
    const service = getAutomationServiceFromFactory();
    
    // Ensure service is properly initialized
    if (!service) {
      throw new Error('Automation service not available');
    }
    
    return service;
  } catch (error) {
    // Log error and re-throw
    console.error('Failed to get automation service:', error);
    throw error;
  }
}
