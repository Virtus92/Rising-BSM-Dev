'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';

interface CronParseResult {
  isValid: boolean;
  description?: string;
  nextRun?: string;
  error?: string;
  errors?: string[];
}

interface ParseCronRequest {
  cronExpression: string;
  timezone?: string;
}

/**
 * Hook for parsing and validating cron expressions
 */
export function useCronParser() {
  const { toast } = useToast();
  const [cronResult, setCronResult] = useState<CronParseResult | null>(null);
  const [cronLoading, setCronLoading] = useState(false);

  const parseCron = useCallback(async (cronExpression: string, timezone = 'UTC') => {
    if (!cronExpression.trim()) {
      setCronResult({
        isValid: false,
        error: 'Cron expression is required'
      });
      return;
    }

    setCronLoading(true);
    setCronResult(null);

    try {
      const response = await fetch('/api/automation/cron/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cronExpression,
          timezone
        } as ParseCronRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to parse cron expression');
      }

      setCronResult({
        isValid: result.data.isValid,
        description: result.data.description,
        nextRun: result.data.nextRun,
        error: result.data.isValid ? undefined : 'Invalid cron expression',
        errors: result.data.errors
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse cron expression';
      
      setCronResult({
        isValid: false,
        error: errorMessage
      });

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setCronLoading(false);
    }
  }, [toast]);

  const validateCron = useCallback(async (cronExpression: string, timezone = 'UTC'): Promise<boolean> => {
    await parseCron(cronExpression, timezone);
    return cronResult?.isValid || false;
  }, [parseCron, cronResult]);

  const clearResult = useCallback(() => {
    setCronResult(null);
  }, []);

  return {
    cronResult,
    cronLoading,
    parseCron,
    validateCron,
    clearResult
  };
}
