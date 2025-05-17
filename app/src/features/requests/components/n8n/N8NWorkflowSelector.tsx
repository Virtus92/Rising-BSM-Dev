'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useToast } from '@/shared/hooks/useToast';
import { Loader2 } from 'lucide-react';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';

/**
 * N8N Workflow Selector Component
 * Allows users to select and trigger N8N workflows for requests
 */
export const N8NWorkflowSelector: React.FC<{
  requestId: number;
  onWorkflowTriggered?: (executionId: string) => void;
}> = ({ requestId, onWorkflowTriggered }) => {
  const [workflows, setWorkflows] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const { toast } = useToast();
  
  // Load available workflows
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        // Get the N8N service
        const serviceFactory = getServiceFactory();
        const n8nService = serviceFactory.createN8NIntegrationService();
        
        // Get available workflows
        const availableWorkflows = await n8nService.getAvailableWorkflows();
        setWorkflows(availableWorkflows);
      } catch (error) {
        console.error('Error loading workflows:', error as Error);
        toast({
          title: 'Error',
          description: 'Failed to load available workflows',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadWorkflows();
  }, [toast]);
  
  // Trigger selected workflow
  const handleTriggerWorkflow = async () => {
    if (!selectedWorkflow) {
      toast({
        title: 'Warning',
        description: 'Please select a workflow first',
        variant: 'warning'
      });
      return;
    }
    
    try {
      setTriggering(true);
      
      // Get the N8N service
      const serviceFactory = getServiceFactory();
      const n8nService = serviceFactory.createN8NIntegrationService();
      
      // Trigger workflow
      const result = await n8nService.triggerWorkflow(requestId, selectedWorkflow);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Workflow triggered successfully',
          variant: 'success'
        });
        
        // Call callback if provided
        if (onWorkflowTriggered) {
          onWorkflowTriggered(result.executionId);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to trigger workflow',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error triggering workflow:', error as Error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while triggering the workflow',
        variant: 'destructive'
      });
    } finally {
      setTriggering(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            Select Workflow
          </label>
          <Select
            value={selectedWorkflow}
            onValueChange={(value) => setSelectedWorkflow(value)}
            disabled={loading || triggering}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a workflow..." />
            </SelectTrigger>
            <SelectContent>
              {workflows.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.name}>
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={handleTriggerWorkflow}
          disabled={!selectedWorkflow || loading || triggering}
        >
          {triggering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Trigger Workflow
        </Button>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading workflows...</span>
        </div>
      )}
    </div>
  );
};

export default N8NWorkflowSelector;