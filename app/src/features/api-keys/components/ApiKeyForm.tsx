'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Copy, Shield, Key, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { ApiKeyType, ApiKeyEnvironment } from '@/domain/entities/ApiKey';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { CreateApiKeyDto } from '@/domain/dtos/ApiKeyDtos';
import { useApiKeys } from '../hooks/useApiKeys';

interface ApiKeyFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ApiKeyForm({ onClose, onSuccess }: ApiKeyFormProps) {
  const { createApiKey, loading } = useApiKeys();
  const [formData, setFormData] = useState<Partial<CreateApiKeyDto>>({
    name: '',
    description: '',
    type: ApiKeyType.STANDARD,
    environment: ApiKeyEnvironment.PRODUCTION,
    permissions: []
  });
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdKey, setCreatedKey] = useState<{ plainTextKey: string; securityWarning: string } | null>(null);

  // Available permissions for standard keys
  const availablePermissions = Object.values(SystemPermission);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (!formData.environment) {
      newErrors.environment = 'Environment is required';
    }

    if (formData.type === ApiKeyType.STANDARD && selectedPermissions.size === 0) {
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
      const createData: CreateApiKeyDto = {
        ...formData as CreateApiKeyDto,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        permissions: formData.type === ApiKeyType.STANDARD ? Array.from(selectedPermissions) : []
      };

      const result = await createApiKey(createData);
      setCreatedKey({
        plainTextKey: result.plainTextKey,
        securityWarning: result.securityWarning
      });
    } catch (error) {
      console.error('Error creating API key:', error);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  // If key was created successfully, show the key
  if (createdKey) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              API Key Created Successfully
            </DialogTitle>
            <DialogDescription>
              Your API key has been created. Please copy it now as you won't be able to see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {createdKey.securityWarning}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={createdKey.plainTextKey}
                  readOnly
                  className="font-mono"
                />
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(createdKey.plainTextKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-sm text-yellow-800">Important Security Information</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Store this key securely in your application's configuration</li>
                  <li>Never commit API keys to version control</li>
                  <li>Use environment variables to store the key</li>
                  <li>Rotate keys regularly for security</li>
                  <li>Monitor key usage for suspicious activity</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={handleFinish}>
              I've Saved the Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for programmatic access to your system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My API Key"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value as ApiKeyType })}
              >
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ApiKeyType.STANDARD}>
                    <div className="flex items-center">
                      <Key className="w-4 h-4 mr-2" />
                      Standard - Custom permissions
                    </div>
                  </SelectItem>
                  <SelectItem value={ApiKeyType.ADMIN}>
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin - Full access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of what this key is used for..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="environment">Environment *</Label>
              <Select 
                value={formData.environment} 
                onValueChange={(value) => setFormData({ ...formData, environment: value as ApiKeyEnvironment })}
              >
                <SelectTrigger className={errors.environment ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ApiKeyEnvironment.PRODUCTION}>
                    <Badge variant="default">Production</Badge>
                  </SelectItem>
                  <SelectItem value={ApiKeyEnvironment.DEVELOPMENT}>
                    <Badge variant="secondary">Development</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.environment && <p className="text-sm text-red-500">{errors.environment}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={errors.expiresAt ? 'border-red-500' : ''}
              />
              {errors.expiresAt && <p className="text-sm text-red-500">{errors.expiresAt}</p>}
            </div>
          </div>

          {/* Permissions Section */}
          {formData.type === ApiKeyType.STANDARD && (
            <div className="space-y-4">
              <div>
                <Label>Permissions *</Label>
                <p className="text-sm text-muted-foreground">
                  Select which permissions this API key should have
                </p>
                {errors.permissions && <p className="text-sm text-red-500">{errors.permissions}</p>}
              </div>

              <Card className="max-h-60 overflow-y-auto">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {availablePermissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={selectedPermissions.has(permission)}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(permission, checked as boolean)
                          }
                        />
                        <Label htmlFor={permission} className="text-sm">
                          {permission.replace('_', ' ').replace('.', ': ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {formData.type === ApiKeyType.ADMIN && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Admin keys have full access to all system functionality. Use with caution.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create API Key'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
