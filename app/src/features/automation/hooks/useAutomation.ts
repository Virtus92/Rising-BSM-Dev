'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { 
  WebhookResponseDto, 
  ScheduleResponseDto, 
  ExecutionResponseDto,
  AutomationDashboardDto,
  TestWebhookResponseDto 
} from '@/domain/dtos/AutomationDtos';
import { 
  CreateWebhookRequest, 
  UpdateWebhookRequest, 
  CreateScheduleRequest, 
  UpdateScheduleRequest,
  TestWebhookRequest 
} from '../api/models';
import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';
import { AutomationExecutionStatus } from '@/domain/entities/AutomationExecution';

interface UseAutomationState {
  loading: boolean;
  error: string | null;
  webhooks: WebhookResponseDto[];
  schedules: ScheduleResponseDto[];
  executions: ExecutionResponseDto[];
  dashboardData: AutomationDashboardDto | null;
}

interface WebhookFilters {
  entityType?: AutomationEntityType;
  operation?: AutomationOperation;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

interface ScheduleFilters {
  active?: boolean;
  timezone?: string;
  page?: number;
  pageSize?: number;
}

interface ExecutionFilters {
  automationType?: 'webhook' | 'schedule';
  automationId?: number;
  status?: AutomationExecutionStatus;
  page?: number;
  pageSize?: number;
}

/**
 * Main automation hook for managing webhooks, schedules, and executions
 */
export function useAutomation() {
  const { toast } = useToast();
  
  const [state, setState] = useState<UseAutomationState>({
    loading: false,
    error: null,
    webhooks: [],
    schedules: [],
    executions: [],
    dashboardData: null
  });

  // Helper function to handle API calls with proper response handling
  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<Response>,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      
      if (!response.ok) {
        // Try to parse error response
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error?.message || errorMsg;
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMsg);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API call failed');
      }
      
      if (successMessage) {
        toast({
          title: 'Success',
          description: successMessage,
          variant: 'default'
        });
      }
      
      setState(prev => ({ ...prev, loading: false }));
      return result.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : (errorMessage || 'An error occurred');
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: message 
      }));
      
      // Only show toast for non-initial load errors
      if (successMessage || errorMessage) {
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive'
        });
      }
      
      // Return null instead of throwing to allow graceful degradation
      return null;
    }
  }, [toast]);

  // Helper to parse paginated responses
  const parsePaginatedResponse = <T,>(response: any): T[] => {
    // Check if response has data array directly
    if (Array.isArray(response)) {
      return response;
    }
    // Check if response has data property that is an array
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    // Default to empty array
    return [];
  };

  // Webhook operations
  const fetchWebhooks = useCallback(async (filters: WebhookFilters = {}) => {
    const searchParams = new URLSearchParams();
    
    if (filters.entityType) searchParams.append('entityType', filters.entityType);
    if (filters.operation) searchParams.append('operation', filters.operation);
    if (filters.active !== undefined) searchParams.append('active', filters.active.toString());
    if (filters.page) searchParams.append('page', filters.page.toString());
    if (filters.pageSize) searchParams.append('pageSize', filters.pageSize.toString());
    
    const queryString = searchParams.toString();
    const url = `/api/automation/webhooks${queryString ? `?${queryString}` : ''}`;
    
    const response = await handleApiCall<any>(
      () => fetch(url),
      undefined,
      'Failed to fetch webhooks'
    );
    
    if (response) {
      const webhooks = parsePaginatedResponse<WebhookResponseDto>(response);
      setState(prev => ({ ...prev, webhooks }));
      return webhooks;
    }
    
    return null;
  }, [handleApiCall]);

  const createWebhook = useCallback(async (data: CreateWebhookRequest) => {
    const webhook = await handleApiCall<WebhookResponseDto>(
      () => fetch('/api/automation/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      'Webhook created successfully',
      'Failed to create webhook'
    );
    
    if (webhook) {
      // Refresh webhooks list to ensure consistency
      await fetchWebhooks();
    }
    
    return webhook;
  }, [handleApiCall, fetchWebhooks]);

  const updateWebhook = useCallback(async (id: string, data: UpdateWebhookRequest) => {
    const webhook = await handleApiCall<WebhookResponseDto>(
      () => fetch(`/api/automation/webhooks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      'Webhook updated successfully',
      'Failed to update webhook'
    );
    
    if (webhook) {
      setState(prev => ({
        ...prev,
        webhooks: prev.webhooks.map(w => w.id === parseInt(id) ? webhook : w)
      }));
    }
    
    return webhook;
  }, [handleApiCall]);

  const deleteWebhook = useCallback(async (id: string) => {
    await handleApiCall<void>(
      () => fetch(`/api/automation/webhooks/${id}`, { method: 'DELETE' }),
      'Webhook deleted successfully',
      'Failed to delete webhook'
    );
    
    setState(prev => ({
      ...prev,
      webhooks: prev.webhooks.filter(w => w.id !== parseInt(id))
    }));
  }, [handleApiCall]);

  const toggleWebhook = useCallback(async (id: string, active: boolean) => {
    const webhook = await handleApiCall<WebhookResponseDto>(
      () => fetch(`/api/automation/webhooks/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      }),
      `Webhook ${active ? 'enabled' : 'disabled'} successfully`,
      'Failed to toggle webhook'
    );
    
    if (webhook) {
      setState(prev => ({
        ...prev,
        webhooks: prev.webhooks.map(w => w.id === parseInt(id) ? webhook : w)
      }));
    }
    
    return webhook;
  }, [handleApiCall]);

  const testWebhook = useCallback(async (data: TestWebhookRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/automation/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      setState(prev => ({ ...prev, loading: false }));
      
      // The API returns the test result in the data property
      if (result.success && result.data) {
        const testResult = result.data;
        
        // Show appropriate toast based on the actual webhook test result
        if (testResult.success) {
          toast({
            title: 'Success',
            description: `Webhook test successful (${testResult.responseStatus} ${testResult.methodUsed})`,
            variant: 'default'
          });
        } else {
          toast({
            title: 'Test Failed',
            description: testResult.errorMessage || 'Webhook test failed',
            variant: 'destructive'
          });
        }
        
        return testResult;
      } else {
        // API call itself failed
        const errorMessage = result.message || result.error?.message || 'Failed to test webhook';
        throw new Error(errorMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to test webhook';
      setState(prev => ({ ...prev, loading: false, error: message }));
      console.error('Webhook test error:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  // Schedule operations
  const fetchSchedules = useCallback(async (filters: ScheduleFilters = {}) => {
    const searchParams = new URLSearchParams();
    
    if (filters.active !== undefined) searchParams.append('active', filters.active.toString());
    if (filters.timezone) searchParams.append('timezone', filters.timezone);
    if (filters.page) searchParams.append('page', filters.page.toString());
    if (filters.pageSize) searchParams.append('pageSize', filters.pageSize.toString());
    
    const queryString = searchParams.toString();
    const url = `/api/automation/schedules${queryString ? `?${queryString}` : ''}`;
    
    const response = await handleApiCall<any>(
      () => fetch(url),
      undefined,
      'Failed to fetch schedules'
    );
    
    if (response) {
      const schedules = parsePaginatedResponse<ScheduleResponseDto>(response);
      setState(prev => ({ ...prev, schedules }));
      return schedules;
    }
    
    return null;
  }, [handleApiCall]);

  const createSchedule = useCallback(async (data: CreateScheduleRequest) => {
    const schedule = await handleApiCall<ScheduleResponseDto>(
      () => fetch('/api/automation/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      'Schedule created successfully',
      'Failed to create schedule'
    );
    
    if (schedule) {
      // Refresh schedules list to ensure consistency
      await fetchSchedules();
    }
    
    return schedule;
  }, [handleApiCall, fetchSchedules]);

  const updateSchedule = useCallback(async (id: string, data: UpdateScheduleRequest) => {
    const schedule = await handleApiCall<ScheduleResponseDto>(
      () => fetch(`/api/automation/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      'Schedule updated successfully',
      'Failed to update schedule'
    );
    
    if (schedule) {
      setState(prev => ({
        ...prev,
        schedules: prev.schedules.map(s => s.id === parseInt(id) ? schedule : s)
      }));
    }
    
    return schedule;
  }, [handleApiCall]);

  const deleteSchedule = useCallback(async (id: string) => {
    await handleApiCall<void>(
      () => fetch(`/api/automation/schedules/${id}`, { method: 'DELETE' }),
      'Schedule deleted successfully',
      'Failed to delete schedule'
    );
    
    setState(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => s.id !== parseInt(id))
    }));
  }, [handleApiCall]);

  const toggleSchedule = useCallback(async (id: string, active: boolean) => {
    const schedule = await handleApiCall<ScheduleResponseDto>(
      () => fetch(`/api/automation/schedules/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      }),
      `Schedule ${active ? 'enabled' : 'disabled'} successfully`,
      'Failed to toggle schedule'
    );
    
    if (schedule) {
      setState(prev => ({
        ...prev,
        schedules: prev.schedules.map(s => s.id === parseInt(id) ? schedule : s)
      }));
    }
    
    return schedule;
  }, [handleApiCall]);

  const executeSchedule = useCallback(async (id: string) => {
    return await handleApiCall<ExecutionResponseDto>(
      () => fetch(`/api/automation/schedules/${id}/execute`, { method: 'POST' }),
      'Schedule executed successfully',
      'Failed to execute schedule'
    );
  }, [handleApiCall]);

  // Execution operations
  const fetchExecutions = useCallback(async (filters: ExecutionFilters = {}) => {
    const searchParams = new URLSearchParams();
    
    if (filters.automationType) searchParams.append('automationType', filters.automationType);
    if (filters.automationId) searchParams.append('automationId', filters.automationId.toString());
    if (filters.status) searchParams.append('status', filters.status);
    if (filters.page) searchParams.append('page', filters.page.toString());
    if (filters.pageSize) searchParams.append('pageSize', filters.pageSize.toString());
    
    const queryString = searchParams.toString();
    const url = `/api/automation/executions${queryString ? `?${queryString}` : ''}`;
    
    const response = await handleApiCall<any>(
      () => fetch(url),
      undefined,
      'Failed to fetch executions'
    );
    
    if (response) {
      const executions = parsePaginatedResponse<ExecutionResponseDto>(response);
      setState(prev => ({ ...prev, executions }));
      return executions;
    }
    
    return null;
  }, [handleApiCall]);

  const retryExecution = useCallback(async (id: string) => {
    return await handleApiCall<ExecutionResponseDto>(
      () => fetch(`/api/automation/executions/${id}/retry`, { method: 'POST' }),
      'Execution retry initiated',
      'Failed to retry execution'
    );
  }, [handleApiCall]);

  // Dashboard operations
  const fetchDashboard = useCallback(async () => {
    const dashboardData = await handleApiCall<AutomationDashboardDto>(
      () => fetch('/api/automation/dashboard'),
      undefined,
      'Failed to fetch dashboard data'
    );
    
    if (dashboardData) {
      setState(prev => ({ ...prev, dashboardData }));
    }
    
    return dashboardData;
  }, [handleApiCall]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    loading: state.loading,
    error: state.error,
    webhooks: state.webhooks,
    schedules: state.schedules,
    executions: state.executions,
    dashboardData: state.dashboardData,

    // Webhook operations
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    toggleWebhook,
    testWebhook,

    // Schedule operations
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    executeSchedule,

    // Execution operations
    fetchExecutions,
    retryExecution,

    // Dashboard operations
    fetchDashboard,

    // Utility
    clearError
  };
}
