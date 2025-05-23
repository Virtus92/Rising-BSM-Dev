'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { Play, Zap, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { RequestDetailResponseDto } from '@/domain/dtos/RequestDtos';
import { useToast } from '@/shared/hooks/useToast';

interface RequestAutomationControlsProps {
  request: RequestDetailResponseDto;
  onComplete?: () => void;
}

interface AutomationOption {
  id: number;
  name: string;
  description: string;
  entityType: string;
  operation: string;
  active: boolean;
}

interface AutomationExecution {
  id: number;
  status: string;
  responseStatus: number | null;
  executionTimeMs: number | null;
  executedAt: string;
  errorMessage: string | null;
}

/**
 * Component for managing automation workflows for requests
 * Replaces the old N8N workflow controls with the new automation system
 */
export const RequestAutomationControls: React.FC<RequestAutomationControlsProps> = ({
  request,
  onComplete
}) => {
  const [webhooks, setWebhooks] = useState<AutomationOption[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string>('');
  const { toast } = useToast();

  // Fetch available webhooks and execution history
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch webhooks for request entity type
        const webhooksResponse = await fetch(`/api/automation/webhooks?entityType=request&operation=update&active=true`);
        const webhooksResult = await webhooksResponse.json();
        
        if (webhooksResult.success) {
          setWebhooks(webhooksResult.data);
        }

        // Fetch execution history for this request
        const executionsResponse = await fetch(`/api/automation/executions?entityId=${request.id}&entityType=request`);
        const executionsResult = await executionsResponse.json();
        
        if (executionsResult.success) {
          setExecutions(executionsResult.data);
        }
      } catch (error) {
        console.error('Error fetching automation data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load automation data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [request.id, toast]);

  // Trigger a webhook automation
  const executeWebhook = async (webhookId: string) => {
    if (!webhookId) return;

    setIsExecuting(true);
    try {
      const response = await fetch('/api/automation/webhooks/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookId: parseInt(webhookId),
          entityId: request.id,
          entityType: 'request',
          entityData: {
            id: request.id,
            name: request.name,
            email: request.email,
            phone: request.phone,
            service: request.service,
            message: request.message,
            status: request.status,
            createdAt: request.createdAt
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Automation Triggered',
          description: 'Webhook automation executed successfully',
          variant: 'default'
        });
        
        // Refresh execution history
        const executionsResponse = await fetch(`/api/automation/executions?entityId=${request.id}&entityType=request`);
        const executionsResult = await executionsResponse.json();
        
        if (executionsResult.success) {
          setExecutions(executionsResult.data);
        }

        if (onComplete) {
          onComplete();
        }
      } else {
        toast({
          title: 'Automation Failed',
          description: result.message || 'Failed to execute webhook automation',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error executing webhook:', error);
      toast({
        title: 'Automation Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Get status badge for execution
  const getExecutionStatusBadge = (execution: AutomationExecution) => {
    switch (execution.status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{execution.status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2 text-sm text-muted-foreground">Loading automation options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Webhook Controls */}
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Available Automations
        </h3>
        
        {webhooks.length > 0 ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedWebhook} onValueChange={setSelectedWebhook}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select an automation to run" />
              </SelectTrigger>
              <SelectContent>
                {webhooks.map((webhook) => (
                  <SelectItem key={webhook.id} value={webhook.id.toString()}>
                    <div className="flex flex-col">
                      <div className="font-medium">{webhook.name}</div>
                      <div className="text-xs text-muted-foreground">{webhook.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => executeWebhook(selectedWebhook)}
              disabled={!selectedWebhook || isExecuting}
              className="gap-2"
            >
              {isExecuting ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isExecuting ? 'Executing...' : 'Execute'}
            </Button>
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Automations Available</AlertTitle>
            <AlertDescription>
              No webhook automations are configured for request processing. 
              Contact your administrator to set up automations for this request type.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Execution History */}
      {executions.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Execution History
            </h3>
            
            <div className="space-y-3">
              {executions
                .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
                .slice(0, 5) // Show only last 5 executions
                .map((execution) => (
                <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getExecutionStatusBadge(execution)}
                    <div className="text-sm">
                      <div className="font-medium">
                        Automation Execution #{execution.id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(execution.executedAt).toLocaleString()}
                        {execution.executionTimeMs && (
                          <span> • {execution.executionTimeMs}ms</span>
                        )}
                        {execution.responseStatus && (
                          <span> • HTTP {execution.responseStatus}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {execution.errorMessage && (
                    <div className="text-xs text-destructive max-w-xs truncate" title={execution.errorMessage}>
                      {execution.errorMessage}
                    </div>
                  )}
                </div>
              ))}
              
              {executions.length > 5 && (
                <div className="text-center">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All Executions ({executions.length})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Info Section */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>About Automations</AlertTitle>
        <AlertDescription>
          Automations allow you to trigger external workflows and data processing for this request. 
          All execution results and extracted data will appear in the data tabs above.
        </AlertDescription>
      </Alert>
    </div>
  );
};