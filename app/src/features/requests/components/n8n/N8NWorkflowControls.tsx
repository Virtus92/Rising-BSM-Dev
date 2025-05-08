'use client';

import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/shared/components/ui/tooltip';
import { RequestDetailResponseDto } from '@/domain/dtos/RequestDtos';
import { useN8NWorkflows, WorkflowStatus } from '@/features/requests/hooks/useN8NWorkflows';
import { PlayCircle, RotateCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface N8NWorkflowControlsProps {
  request: RequestDetailResponseDto;
  onComplete: () => void;
}

/**
 * Component for triggering and monitoring N8N workflows for a request
 */
export const N8NWorkflowControls: React.FC<N8NWorkflowControlsProps> = ({ 
  request, 
  onComplete 
}) => {
  const n8nHook = useN8NWorkflows(request.id);
  const { 
    workflows, 
    isLoading, 
    isProcessing,
    triggerWorkflow,
    getWorkflowStatus
  } = n8nHook;
  
  // State for tracking current execution
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<WorkflowStatus | null>(null);
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [workflowStatus, setWorkflowStatus] = useState<string | null>(
    // Extract status from request metadata if available
    request.metadata?.n8n?.workflowStatus || null
  );
  
  // Get status badge
  const getStatusBadge = () => {
    switch (workflowStatus) {
      case 'started':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock size={14} />
            Starting
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <RotateCw size={14} className="animate-spin" />
            Processing
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle size={14} />
            Completed
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle size={14} />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Handle workflow execution
  const handleRunWorkflow = async () => {
    if (!selectedWorkflow) return;
    
    const result = await triggerWorkflow(selectedWorkflow, {
      additionalData: {
        requestId: request.id,
        requestData: request
      }
    });
    
    // Assuming result being truthy indicates success
    if (result && result.success) {
      setCurrentExecutionId(result.executionId);
      setWorkflowStatus('started');
      
      // This is where you would set up polling for status updates
      // or configure a WebSocket connection to get real-time updates
    }
  };
  
  // Update workflow status when execution status changes
  useEffect(() => {
    if (executionStatus) {
      if (executionStatus.status === 'running') {
        setWorkflowStatus('in_progress');
      } else if (executionStatus.status === 'success') {
        setWorkflowStatus('completed');
        // Notify parent that workflow completed successfully
        onComplete();
      } else if (executionStatus.status === 'error') {
        setWorkflowStatus('error');
      }
    }
  }, [executionStatus, onComplete]);
  
  // Get the n8n metadata or an empty object if it doesn't exist
  const n8nMetadata = request.metadata?.n8n || {};
  
  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-md bg-muted/10">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Process with N8N</h3>
        {getStatusBadge()}
      </div>
      
      <div className="flex items-center gap-2">
        <Select
          value={selectedWorkflow}
          onValueChange={setSelectedWorkflow}
          disabled={isLoading || isProcessing}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select workflow..." />
          </SelectTrigger>
          
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                Loading workflows...
              </SelectItem>
            ) : workflows.length === 0 ? (
              <SelectItem value="none" disabled>
                No workflows available
              </SelectItem>
            ) : (
              workflows.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                disabled={!selectedWorkflow || isProcessing}
                onClick={handleRunWorkflow}
              >
                {isProcessing ? (
                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                {isProcessing ? 'Processing...' : 'Run'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Process this request with the selected N8N workflow</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {n8nMetadata?.progress && (
        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between mb-1">
            <span>Progress:</span>
            <span>{n8nMetadata.progress}%</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full" 
              style={{ width: `${n8nMetadata.progress}%` }}
            />
          </div>
          {n8nMetadata.currentStep && (
            <div className="mt-1 text-xs">
              Current step: {n8nMetadata.currentStep}
            </div>
          )}
        </div>
      )}
      
      {n8nMetadata?.error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
          <p className="font-semibold">Error</p>
          <p>{n8nMetadata.error.message}</p>
        </div>
      )}
    </div>
  );
};