'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/shared/components/ui/card';
import { 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash, 
  Server,
  Search,
  AlertTriangle,
  Eye,
  Code
} from 'lucide-react';
import { useApiEndpoints } from '../hooks/useApiEndpoints';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';

/**
 * API Endpoints management tab component
 */
export const ApiEndpointsTab: React.FC = () => {
  const { 
    endpoints, 
    loading, 
    error,
    fetchEndpoints,
    registerEndpoint,
    discoverEndpoints
  } = useApiEndpoints();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Filter endpoints based on search
  const filteredEndpoints = endpoints.filter(endpoint => 
    endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (endpoint.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">API Endpoints</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchEndpoints}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={discoverEndpoints}
            disabled={loading}
          >
            <Search className="h-4 w-4 mr-2" />
            Discover
          </Button>
          <Button size="sm" onClick={() => setShowRegisterModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Register
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md border border-destructive/20">
          {error}
        </div>
      )}
      
      {/* Search Box */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search endpoints..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          // Loading skeletons
          Array(4).fill(0).map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-3/4 mb-1" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full mb-2" />
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))
        ) : filteredEndpoints.length === 0 ? (
          <div className="col-span-full py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">
              {searchQuery ? 'No matching endpoints found' : 'No API endpoints registered'}
            </h3>
            <p className="text-muted-foreground mt-1 mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms or clear the search.' 
                : 'Register API endpoints to make them available for n8n workflows.'}
            </p>
            {!searchQuery && (
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowRegisterModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Register Manually
                </Button>
                <Button variant="outline" onClick={discoverEndpoints}>
                  <Search className="h-4 w-4 mr-2" />
                  Auto-Discover
                </Button>
              </div>
            )}
          </div>
        ) : (
          // API endpoint cards
          filteredEndpoints.map((endpoint) => (
            <ApiEndpointCard 
              key={endpoint.id}
              endpoint={endpoint}
              onViewDocs={() => {/* TODO: Implement view docs */}}
              onEdit={() => {/* TODO: Implement edit */}}
              onDelete={() => {/* TODO: Implement delete */}}
            />
          ))
        )}
      </div>
      
      {/* TODO: Implement register modal */}
      {/* {showRegisterModal && (
        <RegisterEndpointModal 
          open={showRegisterModal} 
          onClose={() => setShowRegisterModal(false)} 
          onRegister={registerEndpoint}
        />
      )} */}
    </div>
  );
};

/**
 * Card component for displaying an API endpoint
 */
interface ApiEndpointCardProps {
  endpoint: any;
  onViewDocs: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ApiEndpointCard: React.FC<ApiEndpointCardProps> = ({ 
  endpoint,
  onViewDocs,
  onEdit,
  onDelete
}) => {
  // Determine method badge color
  const getMethodBadgeVariant = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <span className={`text-xs px-2 py-1 rounded font-mono mr-2 ${getMethodBadgeVariant(endpoint.method)}`}>
              {endpoint.method.toUpperCase()}
            </span>
            <CardTitle className="text-base">{endpoint.path}</CardTitle>
          </div>
          {endpoint.isPublic && (
            <Badge variant="success">Public</Badge>
          )}
        </div>
        <CardDescription className="mt-1">
          {endpoint.description || 'No description provided'}
          {endpoint.isDeprecated && (
            <Badge variant="destructive" className="ml-2">Deprecated</Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {endpoint.parameters && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">Parameters:</p>
            <code className="bg-muted p-1 rounded text-xs block mt-1 overflow-x-auto">
              {JSON.stringify(endpoint.parameters, null, 2)}
            </code>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onDelete}>
            <Trash className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="secondary" onClick={onViewDocs}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            Docs
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
