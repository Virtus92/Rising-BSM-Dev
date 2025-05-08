import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Separator } from '@/shared/components/ui/separator';

interface ApiEndpointDetailProps {
  endpoint: any;
  onClose?: () => void;
  onEdit?: (endpoint: any) => void;
}

/**
 * Component for displaying detailed information about an API endpoint
 */
export const ApiEndpointDetail: React.FC<ApiEndpointDetailProps> = ({
  endpoint,
  onClose,
  onEdit
}) => {
  const [activeTab, setActiveTab] = React.useState('overview');

  if (!endpoint) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>API Endpoint Details</CardTitle>
          <CardDescription>No endpoint selected</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please select an API endpoint to view its details.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={onClose}>Close</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle>API Endpoint Details</CardTitle>
            <CardDescription>Details for endpoint: {endpoint.path}</CardDescription>
          </div>
          <div className="flex space-x-2">
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(endpoint)}>
                Edit
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="response">Response Format</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Path</h3>
                  <code className="bg-muted rounded-sm px-2 py-1 text-sm block">{endpoint.path}</code>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Method</h3>
                  <Badge variant={getMethodVariant(endpoint.method)}>
                    {endpoint.method}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Description</h3>
                {endpoint.description ? (
                  <p>{endpoint.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">No description available</p>
                )}
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Visibility</h3>
                  <Badge variant={endpoint.isPublic ? 'success' : 'secondary'}>
                    {endpoint.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Status</h3>
                  {endpoint.isDeprecated ? (
                    <Badge variant="destructive">Deprecated</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Created At</h3>
                  <p>{new Date(endpoint.createdAt).toLocaleString()}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Last Updated</h3>
                  <p>{new Date(endpoint.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="parameters">
            <div className="space-y-4">
              {endpoint.parameters && Object.keys(endpoint.parameters).length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-medium">Parameter</th>
                        <th className="text-left py-2 px-4 font-medium">Type</th>
                        <th className="text-left py-2 px-4 font-medium">Required</th>
                        <th className="text-left py-2 px-4 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(endpoint.parameters).map(([name, param]: [string, any]) => (
                        <tr key={name} className="border-b">
                          <td className="py-2 px-4">
                            <code className="bg-muted rounded-sm px-1 py-0.5">{name}</code>
                          </td>
                          <td className="py-2 px-4">
                            <Badge variant="outline">{param.type || 'any'}</Badge>
                          </td>
                          <td className="py-2 px-4">
                            {param.required ? (
                              <Badge variant="default">Required</Badge>
                            ) : (
                              <Badge variant="secondary">Optional</Badge>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {param.description || <span className="text-muted-foreground italic">No description</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No parameter information available
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="response">
            <div className="space-y-4">
              {endpoint.responseFormat && Object.keys(endpoint.responseFormat).length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Response Schema</h3>
                  <pre className="bg-muted rounded-md p-4 overflow-auto text-sm">
                    {JSON.stringify(endpoint.responseFormat, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No response format information available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Helper function to get badge variant based on HTTP method
function getMethodVariant(method: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'default';
    case 'POST':
      return 'secondary';
    case 'PUT':
    case 'PATCH':
      return 'outline';
    case 'DELETE':
      return 'destructive';
    default:
      return 'outline';
  }
}
