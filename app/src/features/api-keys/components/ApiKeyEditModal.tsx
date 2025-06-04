'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Shield, Key, Calendar, AlertTriangle } from 'lucide-react';
import { ApiKeyResponseDto, UpdateApiKeyDto } from '@/domain/dtos/ApiKeyDtos';
import { ApiKeyType, ApiKeyStatus } from '@/domain/entities/ApiKey';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { useApiKeys } from '../hooks/useApiKeys';
import { useToast } from '@/shared/hooks/useToast';

interface ApiKeyEditModalProps {
  apiKey: ApiKeyResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApiKeyEditModal({ apiKey, onClose, onSuccess }: ApiKeyEditModalProps) {
  const { updateApiKey, loading } = useApiKeys();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<UpdateApiKeyDto>>({
    name: '',
    description: '',
    status: ApiKeyStatus.ACTIVE,
    permissions: []
  });
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available permissions for standard keys
  const availablePermissions = Object.values(SystemPermission);

  // Initialize form data when apiKey prop changes
  useEffect(() => {
    if (apiKey) {
      setFormData({
        name: apiKey.name,
        description: apiKey.description || '',
        status: apiKey.status,
        permissions: apiKey.permissions || []
      });
      
      // Set expiration date
      if (apiKey.expiresAt) {
        const expirationDate = new Date(apiKey.expiresAt);
        // Format for datetime-local input
        const formattedDate = expirationDate.toISOString().slice(0, 16);
        setExpiresAt(formattedDate);
      } else {
        setExpiresAt('');
      }

      // Set selected permissions
      const permissions = new Set(apiKey.permissions || []);
      setSelectedPermissions(permissions);
    }
  }, [apiKey]);

  if (!apiKey) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (apiKey.type === ApiKeyType.STANDARD && selectedPermissions.size === 0) {
      newErrors.permissions = 'At least one permission is required for standard keys';
    }

    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (expDate <= new Date()) {
        newErrors.expiresAt = 'Expiration date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const updateData: UpdateApiKeyDto = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        expiresAt: new Date(expiresAt),
        permissions: apiKey.type === ApiKeyType.STANDARD ? Array.from(selectedPermissions) : undefined
      };

      await updateApiKey(apiKey.id, updateData);
      
      toast({
        title: 'Success',
        description: `API key "${formData.name}" has been updated successfully`
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const newSelected = new Set(selectedPermissions);
    if (checked) {
      newSelected.add(permission);
    } else {
      newSelected.delete(permission);
    }
    setSelectedPermissions(newSelected);
    setFormData({ ...formData, permissions: Array.from(newSelected) });
  };

  const formatPermissionLabel = (permission: string) => {
    return permission
      .replace(/_/g, ' ')
      .replace(/\./g, ': ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {apiKey.type === ApiKeyType.ADMIN ? (
              <Shield className="w-5 h-5 text-purple-600" />
            ) : (
              <Key className="w-5 h-5 text-blue-600" />
            )}
            <span>Edit API Key</span>
          </DialogTitle>
          <DialogDescription>
            Update the settings and permissions for this API key.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Read-only Information */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Key Information (Read-only)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="flex items-center space-x-2">
                    {apiKey.type === ApiKeyType.ADMIN ? (
                      <>
                        <Shield className="w-4 h-4 text-purple-600" />
                        <Badge variant="default" className="bg-purple-100 text-purple-800">Admin</Badge>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 text-blue-600" />
                        <Badge variant="outline">Standard</Badge>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Environment</Label>
                  <Badge variant={apiKey.environment === 'production' ? 'default' : 'secondary'}>
                    {apiKey.environment}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Key Preview</Label>
                <code className="block bg-background px-2 py-1 rounded text-sm font-mono">
                  {apiKey.keyPreview}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="API Key Name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of what this key is used for..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={errors.expiresAt ? 'border-red-500' : ''}
                />
                {expiresAt && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExpiresAt('')}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {errors.expiresAt && <p className="text-sm text-red-500">{errors.expiresAt}</p>}
              <p className="text-xs text-muted-foreground">
                Leave empty for no expiration. Current time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>
          </div>

          {/* Permissions Section - Only for Standard Keys */}
          {apiKey.type === ApiKeyType.STANDARD && (
            <div className="space-y-4">
              <div>
                <Label>Permissions *</Label>
                <p className="text-sm text-muted-foreground">
                  Select which permissions this API key should have
                </p>
                {errors.permissions && <p className="text-sm text-red-500">{errors.permissions}</p>}
              </div>

              <Card className="max-h-60 overflow-y-auto">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Available Permissions</CardTitle>
                  <CardDescription>
                    {selectedPermissions.size} of {availablePermissions.length} permissions selected
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 gap-3">
                    {availablePermissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50">
                        <Checkbox
                          id={permission}
                          checked={selectedPermissions.has(permission)}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(permission, checked as boolean)
                          }
                        />
                        <Label htmlFor={permission} className="text-sm flex-1 cursor-pointer">
                          <div className="font-medium">{formatPermissionLabel(permission)}</div>
                          <div className="text-xs text-muted-foreground font-mono">{permission}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedPermissions.size > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Permissions</Label>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(selectedPermissions).map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {formatPermissionLabel(permission)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Key Info */}
          {apiKey.type === ApiKeyType.ADMIN && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Admin keys have full access to all system functionality. Permissions cannot be modified for admin keys.
              </AlertDescription>
            </Alert>
          )}

          {/* Status Warning */}
          {apiKey.status === 'revoked' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                This API key is revoked and cannot be reactivated. You can only update its name and description for record-keeping purposes.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update API Key'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
