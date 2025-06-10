'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield, 
  Key,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { ApiKeyResponseDto } from '@/domain/dtos/ApiKeyDtos';
import { ApiKeyType, ApiKeyStatus, ApiKeyEnvironment } from '@/domain/entities/ApiKey';
import { cn } from '@/shared/utils/cn';
import { useApiKeys } from '../hooks/useApiKeys';
import { useToast } from '@/shared/hooks/useToast';
import { ApiKeyDetailsModal } from './ApiKeyDetailsModal';
import { ApiKeyEditModal } from './ApiKeyEditModal';
import { ApiKeyPermissionsModal } from './ApiKeyPermissionsModal';
import ApiKeyPermissionsDebugger from '../utils/ApiKeyPermissionsDebugger';

interface ApiKeyListProps {
  apiKeys: ApiKeyResponseDto[];
  onRefresh: () => void;
}

export function ApiKeyList({ apiKeys, onRefresh }: ApiKeyListProps) {
  const { 
    deleteApiKey, 
    activateApiKey, 
    deactivateApiKey, 
    revokeApiKey,
    loading 
  } = useApiKeys();
  
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [revokeReason, setRevokeReason] = useState('');
  const [selectedKeyForRevoke, setSelectedKeyForRevoke] = useState<ApiKeyResponseDto | null>(null);
  
  // Modal states
  const [selectedKeyForDetails, setSelectedKeyForDetails] = useState<ApiKeyResponseDto | null>(null);
  const [selectedKeyForEdit, setSelectedKeyForEdit] = useState<ApiKeyResponseDto | null>(null);
  const [selectedKeyForPermissions, setSelectedKeyForPermissions] = useState<ApiKeyResponseDto | null>(null);

  // Filter API keys based on search and filters
  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || key.status === statusFilter;
    const matchesType = typeFilter === 'all' || key.type === typeFilter;
    const matchesEnvironment = environmentFilter === 'all' || key.environment === environmentFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesEnvironment;
  });

  const getStatusBadge = (key: ApiKeyResponseDto) => {
    if (!key.isActive) {
      if (key.status === 'revoked') {
        return <Badge variant="destructive">Revoked</Badge>;
      } else if (key.isExpired) {
        return <Badge variant="destructive">Expired</Badge>;
      } else {
        return <Badge variant="secondary">Inactive</Badge>;
      }
    }
    
    if (key.isExpiringSoon) {
      return <Badge variant="warning">Expiring Soon</Badge>;
    }
    
    return <Badge variant="success">Active</Badge>;
  };

  const getTypeBadge = (type: ApiKeyType) => {
    return type === ApiKeyType.ADMIN ? (
      <Badge variant="default" className="bg-purple-100 text-purple-800">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline">
        <Key className="w-3 h-3 mr-1" />
        Standard
      </Badge>
    );
  };

  const getEnvironmentBadge = (environment: ApiKeyEnvironment) => {
    return environment === ApiKeyEnvironment.PRODUCTION ? (
      <Badge variant="default">Production</Badge>
    ) : (
      <Badge variant="secondary">Development</Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastUsed = (lastUsedAt?: string) => {
    if (!lastUsedAt) return 'Never';
    
    const lastUsed = new Date(lastUsedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(lastUsedAt);
  };

  // Handle API key activation
  const handleActivate = async (apiKey: ApiKeyResponseDto) => {
    try {
      await activateApiKey(apiKey.id);
      toast({ 
        title: 'Success', 
        description: `API key "${apiKey.name}" has been activated` 
      });
      onRefresh();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: `Failed to activate API key: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  // Handle API key deactivation
  const handleDeactivate = async (apiKey: ApiKeyResponseDto) => {
    try {
      await deactivateApiKey(apiKey.id);
      toast({ 
        title: 'Success', 
        description: `API key "${apiKey.name}" has been deactivated` 
      });
      onRefresh();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: `Failed to deactivate API key: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  // Handle API key deletion
  const handleDelete = async (apiKey: ApiKeyResponseDto) => {
    try {
      await deleteApiKey(apiKey.id);
      toast({ 
        title: 'Success', 
        description: `API key "${apiKey.name}" has been deleted` 
      });
      onRefresh();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: `Failed to delete API key: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  // Handle API key revocation
  const handleRevoke = async () => {
    if (!selectedKeyForRevoke) return;

    try {
      await revokeApiKey(selectedKeyForRevoke.id, { reason: revokeReason });
      toast({ 
        title: 'Success', 
        description: `API key "${selectedKeyForRevoke.name}" has been revoked` 
      });
      setSelectedKeyForRevoke(null);
      setRevokeReason('');
      onRefresh();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: `Failed to revoke API key: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys ({filteredKeys.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No API keys found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Key Preview</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{key.name}</div>
                        {key.description && (
                          <div className="text-sm text-muted-foreground">
                            {key.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(key.type)}
                    </TableCell>
                    <TableCell>
                      {getEnvironmentBadge(key.environment)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(key)}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {key.keyPreview}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatLastUsed(key.lastUsedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {key.usageCount} calls
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {key.expiresAt ? (
                          <div className={cn(
                            key.isExpiringSoon && "text-orange-600",
                            key.isExpired && "text-red-600"
                          )}>
                            {formatDate(key.expiresAt)}
                            {key.daysUntilExpiration !== null && key.daysUntilExpiration !== undefined && key.daysUntilExpiration >= 0 && (
                              <div className="text-xs text-muted-foreground">
                                {key.daysUntilExpiration} days left
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedKeyForDetails(key)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedKeyForEdit(key)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {key.type === ApiKeyType.STANDARD && (
                            <DropdownMenuItem onClick={() => {
                              console.log('🔍 Opening permissions modal for API key:', key.name);
                              ApiKeyPermissionsDebugger.debugApiKey(key, 'Before Opening Permissions Modal');
                              setSelectedKeyForPermissions(key);
                            }}>
                              <Shield className="mr-2 h-4 w-4" />
                              Manage Permissions
                            </DropdownMenuItem>
                          )}
                          {key.isActive ? (
                            <DropdownMenuItem onClick={() => handleDeactivate(key)} disabled={loading}>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : key.status !== 'revoked' ? (
                            <DropdownMenuItem onClick={() => handleActivate(key)} disabled={loading}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          ) : null}
                          
                          {/* Revoke Option */}
                          {key.status !== 'revoked' && (
                            <DropdownMenuItem 
                              className="text-orange-600"
                              onClick={() => {
                                setSelectedKeyForRevoke(key);
                                setRevokeReason('');
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Revoke
                            </DropdownMenuItem>
                          )}

                          {/* Delete Dialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to permanently delete the API key "{key.name}"? 
                                  This action cannot be undone and will remove all traces of this key from the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(key)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={loading}
                                >
                                  {loading ? 'Deleting...' : 'Delete Key'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={!!selectedKeyForRevoke} onOpenChange={(open) => {
        if (!open) {
          setSelectedKeyForRevoke(null);
          setRevokeReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the API key "{selectedKeyForRevoke?.name}"? 
              This action cannot be undone and will immediately prevent all access using this key.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for revocation (optional)</label>
              <Textarea
                placeholder="Enter a reason for revoking this API key..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedKeyForRevoke(null);
                setRevokeReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRevoke}
              disabled={loading}
            >
              {loading ? 'Revoking...' : 'Revoke Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <ApiKeyDetailsModal
        apiKey={selectedKeyForDetails}
        onClose={() => setSelectedKeyForDetails(null)}
      />

      {/* Edit Modal */}
      <ApiKeyEditModal
        apiKey={selectedKeyForEdit}
        onClose={() => setSelectedKeyForEdit(null)}
        onSuccess={() => {
          setSelectedKeyForEdit(null);
          onRefresh();
        }}
      />

      {/* Permissions Modal */}
      <ApiKeyPermissionsModal
        apiKey={selectedKeyForPermissions}
        onClose={() => setSelectedKeyForPermissions(null)}
        onSuccess={() => {
          setSelectedKeyForPermissions(null);
          onRefresh();
        }}
      />
    </div>
  );
}
