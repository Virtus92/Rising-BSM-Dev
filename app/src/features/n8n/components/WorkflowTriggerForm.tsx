import React, { useState } from 'react';
import { useN8NWorkflows } from '../hooks/useN8NWorkflows';
import { useExecutions } from '../hooks/useExecutions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Spinner } from '@/shared/components/ui/spinner';
import { Label } from '@/shared/components/ui/label';
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface WorkflowTriggerFormProps {
  requestId?: number;
  entityId?: number;
  entityType?: string;
  onSuccess?: (response: any) => void;
  onCancel?: () => void;
}

/**
 * Component for triggering N8N workflows with custom data
 */
export const WorkflowTriggerForm: React.FC<WorkflowTriggerFormProps> = ({
  requestId = 0,
  entityId,
  entityType,
  onSuccess,
  onCancel
}) => {
  const { workflows, loading: loadingWorkflows } = useN8NWorkflows();
  const { triggerWorkflow } = useExecutions();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [dataInput, setDataInput] = useState<string>('{}');
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Validate JSON input when it changes
  React.useEffect(() => {
    try {
      if (dataInput) {
        JSON.parse(dataInput);
        setJsonError(null);
      }
    } catch (err) {
      setJsonError('Invalid JSON format');
    }
  }, [dataInput]);

  // Prepare initial data
  React.useEffect(() => {
    const initialData: Record<string, any> = {};
    
    if (entityId && entityType) {
      initialData.entityId = entityId;
      initialData.entityType = entityType;
    }
    
    setDataInput(JSON.stringify(initialData, null, 2));
  }, [entityId, entityType]);

  // Handle workflow selection
  const handleWorkflowChange = (value: string) => {
    setSelectedWorkflow(value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedWorkflow) {
      setError('Please select a workflow');
      return;
    }
    
    if (jsonError) {
      setError('Please fix the JSON data errors');
      return;
    }
    
    let data: any = {};
    try {
      data = JSON.parse(dataInput);
    } catch (err) {
      setError('Invalid JSON data');
      return;
    }
    
    setTriggering(true);
    setError(null);
    
    try {
      const response = await triggerWorkflow(requestId, selectedWorkflow, data);
      if (response && onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger workflow');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Trigger Workflow</CardTitle>
          <CardDescription>Select a workflow and provide data to trigger it</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="workflow">Workflow</Label>
            <Select 
              value={selectedWorkflow} 
              onValueChange={handleWorkflowChange}
              disabled={loadingWorkflows || triggering}
            >
              <SelectTrigger id="workflow">
                <SelectValue placeholder="Select a workflow" />
              </SelectTrigger>
              <SelectContent>
                {loadingWorkflows ? (
                  <div className="flex items-center justify-center p-2">
                    <Spinner size="sm" className="mr-2" />
                    Loading...
                  </div>
                ) : workflows.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">
                    No workflows available
                  </div>
                ) : (
                  workflows
                    .filter(workflow => workflow.active)
                    .map(workflow => (
                      <SelectItem key={workflow.id} value={workflow.name}>
                        {workflow.name}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="data">Data (JSON)</Label>
              {jsonError && (
                <div className="text-sm text-destructive flex items-center">
                  <InfoCircledIcon className="h-4 w-4 mr-1" />
                  {jsonError}
                </div>
              )}
            </div>
            <Textarea
              id="data"
              placeholder="Enter JSON data"
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              className="font-mono h-40"
              disabled={triggering}
            />
            <p className="text-sm text-muted-foreground">
              Provide data to be sent to the workflow in JSON format
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={triggering}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!selectedWorkflow || !!jsonError || triggering}
          >
            {triggering ? <Spinner size="sm" className="mr-2" /> : null}
            Trigger Workflow
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
