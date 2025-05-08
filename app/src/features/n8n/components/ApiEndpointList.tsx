import React, { useState } from 'react';
import { useApiEndpoints } from '../hooks/useApiEndpoints';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Spinner } from '@/shared/components/ui/spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { MoreHorizontalIcon, PencilIcon, TrashIcon, EyeIcon } from 'lucide-react';

interface ApiEndpointListProps {
  onEdit?: (endpoint: any) => void;
  onView?: (endpoint: any) => void;
  onDiscover?: () => void;
  onCreate?: () => void;
}

/**
 * Component for displaying a list of N8N API endpoints
 */
export const ApiEndpointList: React.FC<ApiEndpointListProps> = ({
  onEdit,
  onView,
  onDiscover,
  onCreate
}) => {
  const { apiEndpoints, loading, error, fetchApiEndpoints, deleteApiEndpoint } = useApiEndpoints();
  const [searchTerm, setSearchTerm] = useState('');
  const [endpointToDelete, setEndpointToDelete] = useState<{ id: number; path: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter endpoints based on search term
  const filteredEndpoints = searchTerm
    ? apiEndpoints.filter(endpoint => 
        endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (endpoint.description && endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : apiEndpoints;

  // Handle refresh button click
  const handleRefresh = () => {
    fetchApiEndpoints();
  };

  // Handle endpoint deletion
  const handleDelete = async () => {
    if (!endpointToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteApiEndpoint(endpointToDelete.id);
    } finally {
      setIsDeleting(false);
      setEndpointToDelete(null);
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Registered N8N API endpoints</CardDescription>
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
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Registered N8N API endpoints</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" onClick={handleRefresh} disabled={loading}>
            {loading ? <Spinner size="sm" className="mr-2" /> : null}
            Refresh
          </Button>
          {onDiscover && (
            <Button size="sm" variant="outline" onClick={onDiscover}>
              Discover
            </Button>
          )}
          {onCreate && (
            <Button size="sm" onClick={onCreate}>
              Add Endpoint
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search endpoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        {loading && apiEndpoints.length === 0 ? (
          <div className="flex justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : filteredEndpoints.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            {searchTerm ? 'No endpoints match your search' : 'No API endpoints available'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEndpoints.map((endpoint) => (
                  <TableRow key={endpoint.id}>
                    <TableCell>
                      <code className="bg-muted rounded-sm px-1 py-0.5">{endpoint.path}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getMethodVariant(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={endpoint.isPublic ? 'success' : 'secondary'}>
                        {endpoint.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {endpoint.isDeprecated ? (
                        <Badge variant="destructive">Deprecated</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontalIcon className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(endpoint)}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(endpoint)}>
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => setEndpointToDelete({ id: endpoint.id, path: endpoint.path })}
                            className="text-destructive focus:text-destructive"
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!endpointToDelete} onOpenChange={(open) => !open && setEndpointToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the API endpoint <code className="bg-muted rounded-sm px-1 py-0.5">{endpointToDelete?.path}</code>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Spinner size="sm" className="mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
