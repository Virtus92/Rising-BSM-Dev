import React, { useState } from 'react';
import { useN8NWorkflows } from '../hooks/useN8NWorkflows';
import { useExecutions } from '../hooks/useExecutions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Spinner } from '@/shared/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Separator } from '@/shared/components/ui/separator';

interface WorkflowDetailProps {
  workflowId: string;
  onClose?: () => void;
  onTrigger?: (response: any) => void;
}

/**
 * Component for displaying detailed information about an N8N workflow
 */
export const WorkflowDetail: React.FC<WorkflowDetailProps> = ({ 
  workflowId, 
  onClose,
  onTrigger
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [triggering, setTriggering] = useState(false);
  const { getWorkflowDetails } = useN8NWorkflows();
  const { triggerWorkflow } = useExecutions();
  const [workflowDetails, setWorkflowDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workflow details on mount
  React.useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const details = await getWorkflowDetails(workflowId);
        if (details) {
          setWorkflowDetails(details);
        } else {
          setError('Failed to fetch workflow details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [workflowId, getWorkflowDetails]);

  // Handle workflow trigger
  const handleTrigger = async () => {
    if (!workflowDetails) return;

    setTriggering(true);
    try {
      const response = await triggerWorkflow(0, workflowDetails.name, {});
      if (response && onTrigger) {
        onTrigger(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger workflow');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
          <CardDescription>Loading workflow information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
          <CardDescription>Error loading workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-end mt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!workflowDetails) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
          <CardDescription>Workflow not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-muted-foreground">
            The requested workflow could not be found or you do not have access to it.
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle>{workflowDetails.name}</CardTitle>
            <CardDescription>Workflow Details</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="secondary" 
              onClick={onClose}
            >
              Close
            </Button>
            <Button 
              onClick={handleTrigger} 
              disabled={triggering || !workflowDetails.active}
            >
              {triggering ? <Spinner size="sm" className="mr-2" /> : null}
              Trigger Workflow
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Status</h3>
                <Badge variant={workflowDetails.active ? 'success' : 'secondary'}>
                  {workflowDetails.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                {workflowDetails.description ? (
                  <p>{workflowDetails.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">No description available</p>
                )}
              </div>
              
              {workflowDetails.tags && workflowDetails.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {workflowDetails.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="technical">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Workflow ID</h3>
                <code className="bg-muted p-2 rounded-md block">{workflowDetails.id}</code>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Created</h3>
                <p>{new Date(workflowDetails.createdAt).toLocaleString()}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Last Updated</h3>
                <p>{new Date(workflowDetails.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
