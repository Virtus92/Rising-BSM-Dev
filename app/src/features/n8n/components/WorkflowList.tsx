import React, { useState } from 'react';
import { useN8NWorkflows } from '../hooks/useN8NWorkflows';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Spinner } from '@/shared/components/ui/spinner';

interface WorkflowListProps {
  onSelectWorkflow?: (workflow: any) => void;
}

/**
 * Component for displaying a list of available N8N workflows
 */
export const WorkflowList: React.FC<WorkflowListProps> = ({ onSelectWorkflow }) => {
  const { workflows, loading, error, fetchWorkflows } = useN8NWorkflows();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter workflows based on search term
  const filteredWorkflows = searchTerm
    ? workflows.filter(workflow => 
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (workflow.description && workflow.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : workflows;

  // Handle refresh button click
  const handleRefresh = () => {
    fetchWorkflows();
  };

  // Handle workflow selection
  const handleSelect = (workflow: any) => {
    if (onSelectWorkflow) {
      onSelectWorkflow(workflow);
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Workflows</CardTitle>
          <CardDescription>Available N8N workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/15 p-4 mb-4">
            <p className="text-destructive">{error}</p>
          </div>
          <Button onClick={handleRefresh}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Workflows</CardTitle>
          <CardDescription>Available N8N workflows</CardDescription>
        </div>
        <Button size="sm" onClick={handleRefresh} disabled={loading}>
          {loading ? <Spinner size="sm" className="mr-2" /> : null}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        {loading && workflows.length === 0 ? (
          <div className="flex justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            {searchTerm ? 'No workflows match your search' : 'No workflows available'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">{workflow.name}</TableCell>
                    <TableCell>
                      {workflow.description ? workflow.description : <span className="text-muted-foreground italic">No description</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={workflow.active ? 'success' : 'secondary'}>
                        {workflow.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {workflow.tags && workflow.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {workflow.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">No tags</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleSelect(workflow)}>
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
