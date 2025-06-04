'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { 
  Shield, 
  Key, 
  Calendar, 
  Activity, 
  MapPin, 
  Clock, 
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy
} from 'lucide-react';
import { ApiKeyResponseDto } from '@/domain/dtos/ApiKeyDtos';
import { ApiKeyType, ApiKeyEnvironment } from '@/domain/entities/ApiKey';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/useToast';

interface ApiKeyDetailsModalProps {
  apiKey: ApiKeyResponseDto | null;
  onClose: () => void;
}

export function ApiKeyDetailsModal({ apiKey, onClose }: ApiKeyDetailsModalProps) {
  const { toast } = useToast();

  if (!apiKey) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${label} has been copied to your clipboard`
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  const getStatusIcon = () => {
    if (!apiKey.isActive) {
      if (apiKey.status === 'revoked') {
        return <XCircle className="w-4 h-4 text-red-500" />;
      } else if (apiKey.isExpired) {
        return <Clock className="w-4 h-4 text-red-500" />;
      } else {
        return <XCircle className="w-4 h-4 text-gray-500" />;
      }
    }
    
    if (apiKey.isExpiringSoon) {
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
    
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!apiKey.isActive) {
      if (apiKey.status === 'revoked') return 'Revoked';
      if (apiKey.isExpired) return 'Expired';
      return 'Inactive';
    }
    if (apiKey.isExpiringSoon) return 'Expiring Soon';
    return 'Active';
  };

  const getStatusBadgeVariant = () => {
    if (!apiKey.isActive) {
      if (apiKey.status === 'revoked' || apiKey.isExpired) return 'destructive';
      return 'secondary';
    }
    if (apiKey.isExpiringSoon) return 'warning';
    return 'success';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {apiKey.type === ApiKeyType.ADMIN ? (
              <Shield className="w-5 h-5 text-purple-600" />
            ) : (
              <Key className="w-5 h-5 text-blue-600" />
            )}
            <span>{apiKey.name}</span>
            <Badge variant={getStatusBadgeVariant()} className="ml-2">
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-medium">{apiKey.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="flex items-center space-x-2">
                    {apiKey.type === ApiKeyType.ADMIN ? (
                      <>
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">Admin Key</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Standard Key</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {apiKey.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{apiKey.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Environment</label>
                  <Badge variant={apiKey.environment === ApiKeyEnvironment.PRODUCTION ? 'default' : 'secondary'}>
                    {apiKey.environment === ApiKeyEnvironment.PRODUCTION ? 'Production' : 'Development'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon()}
                    <span className="font-medium">{getStatusText()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Information */}
          <Card>
            <CardHeader>
              <CardTitle>Key Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Key Preview</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {apiKey.keyPreview}
                  </code>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(apiKey.keyPreview, 'Key preview')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Key Prefix</label>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {apiKey.keyPrefix}
                  </code>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Key ID</label>
                  <span className="font-mono text-sm">#{apiKey.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Usage Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{apiKey.usageCount}</div>
                  <div className="text-sm text-muted-foreground">Total Calls</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {apiKey.lastUsedAt ? 'Recently' : 'Never'}
                  </div>
                  <div className="text-sm text-muted-foreground">Last Used</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {apiKey.isActive ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-muted-foreground">Currently Active</div>
                </div>
              </div>

              {apiKey.lastUsedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Last Used</span>
                    </label>
                    <p className="text-sm">{formatDate(apiKey.lastUsedAt)}</p>
                  </div>
                  {apiKey.lastUsedIp && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>Last IP Address</span>
                      </label>
                      <code className="text-sm font-mono">{apiKey.lastUsedIp}</code>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions (for Standard keys) */}
          {apiKey.type === ApiKeyType.STANDARD && (
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  Permissions assigned to this API key
                </CardDescription>
              </CardHeader>
              <CardContent>
                {apiKey.permissions && apiKey.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {apiKey.permissions.map((permission) => (
                      <Badge key={permission} variant="outline">
                        {permission.replace('_', ' ').replace('.', ': ')}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No permissions assigned</p>
                )}
              </CardContent>
            </Card>
          )}

          {apiKey.type === ApiKeyType.ADMIN && (
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-800">Full System Access</p>
                    <p className="text-sm text-purple-600">
                      Admin keys have access to all system functionality
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expiration Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Expiration & Lifecycle</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expires</label>
                  <p className="text-sm">
                    {apiKey.expiresAt ? (
                      <span className={apiKey.isExpired ? 'text-red-600 font-medium' : 
                                     apiKey.isExpiringSoon ? 'text-orange-600 font-medium' : ''}>
                        {formatDate(apiKey.expiresAt)}
                        {apiKey.daysUntilExpiration !== null && apiKey.daysUntilExpiration !== undefined && apiKey.daysUntilExpiration >= 0 && (
                          <span className="block text-xs text-muted-foreground">
                            {apiKey.daysUntilExpiration} days remaining
                          </span>
                        )}
                      </span>
                    ) : (
                      'Never expires'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{formatDate(apiKey.createdAt)}</p>
                </div>
              </div>

              {apiKey.updatedAt && apiKey.updatedAt !== apiKey.createdAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Modified</label>
                  <p className="text-sm">{formatDate(apiKey.updatedAt)}</p>
                </div>
              )}

              {apiKey.revokedAt && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">Key Revoked</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Revoked on {formatDate(apiKey.revokedAt)}
                  </p>
                  {apiKey.revokedReason && (
                    <p className="text-sm text-red-600 mt-1">
                      Reason: {apiKey.revokedReason}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Creator Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Creator Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created by User ID</label>
                <p className="font-mono text-sm">#{apiKey.createdBy}</p>
              </div>
            </CardContent>
          </Card>

          {/* Security Warnings */}
          {(apiKey.isExpired || apiKey.isExpiringSoon || !apiKey.isActive) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Security Notices</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {apiKey.isExpired && (
                  <p className="text-sm text-orange-700">
                    ⚠️ This API key has expired and will not work for authentication
                  </p>
                )}
                {apiKey.isExpiringSoon && !apiKey.isExpired && (
                  <p className="text-sm text-orange-700">
                    ⚠️ This API key will expire soon. Consider extending or replacing it
                  </p>
                )}
                {!apiKey.isActive && !apiKey.isExpired && (
                  <p className="text-sm text-orange-700">
                    ⚠️ This API key is inactive and will not work for authentication
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
