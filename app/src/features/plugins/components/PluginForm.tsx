'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreatePlugin } from '../hooks/useCreatePlugin';
import { usePlugin } from '../hooks/usePlugin';
import { CreatePluginDto, UpdatePluginDto, PluginDto } from '@/domain/dtos/PluginDtos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { 
  Package, Save, X, Plus, Trash2, Upload, 
  Code, Palette, Workflow, Layers, Shield, 
  DollarSign, Tag, Image, AlertTriangle
} from 'lucide-react';

// Plugin type icons
const PluginTypeIcons = {
  ui: <Palette className="h-4 w-4" />,
  api: <Code className="h-4 w-4" />,
  automation: <Workflow className="h-4 w-4" />,
  mixed: <Layers className="h-4 w-4" />
};

// Form validation schema
const pluginFormSchema = z.object({
  name: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, {
    message: 'Name must contain only lowercase letters, numbers, and hyphens'
  }),
  displayName: z.string().min(3).max(200),
  description: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be in format X.Y.Z'
  }),
  type: z.enum(['ui', 'api', 'automation', 'mixed']),
  category: z.string().min(1),
  minAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be in format X.Y.Z'
  }),
  maxAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be in format X.Y.Z'
  }).optional().or(z.literal('')),
  trialDays: z.number().min(0).max(365).default(0),
  tags: z.array(z.string()).default([]),
  permissions: z.array(z.object({
    code: z.string(),
    description: z.string(),
    required: z.boolean()
  })).default([]),
  dependencies: z.array(z.object({
    pluginName: z.string(),
    minVersion: z.string().optional(),
    maxVersion: z.string().optional()
  })).default([]),
  pricing: z.record(z.any()).optional().default({})
});

type PluginFormData = z.infer<typeof pluginFormSchema>;

interface PluginFormProps {
  pluginId?: number | string;
  mode: 'create' | 'edit';
}

export const PluginForm = ({ pluginId, mode }: PluginFormProps) => {
  const router = useRouter();
  const [currentTag, setCurrentTag] = useState('');
  const [currentPermission, setCurrentPermission] = useState({ code: '', description: '', required: true });
  const [currentDependency, setCurrentDependency] = useState({ pluginName: '', minVersion: '', maxVersion: '' });
  
  const { createPlugin, isCreating } = useCreatePlugin();
  const { plugin, isLoading, updatePlugin, isUpdatingPlugin } = mode === 'edit' && pluginId 
    ? usePlugin(pluginId) 
    : { plugin: null, isLoading: false, updatePlugin: null, isUpdatingPlugin: false };
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PluginFormData>({
    resolver: zodResolver(pluginFormSchema) as any,
    defaultValues: {
      type: 'ui',
      category: '',
      trialDays: 0,
      tags: [],
      permissions: [],
      dependencies: [],
      pricing: {}
    }
  });
  
  const watchedTags = watch('tags');
  const watchedPermissions = watch('permissions');
  const watchedDependencies = watch('dependencies');
  const watchedType = watch('type');
  
  // Load plugin data for edit mode
  useEffect(() => {
    if (mode === 'edit' && plugin) {
      setValue('name', plugin.name);
      setValue('displayName', plugin.displayName);
      setValue('description', plugin.description || '');
      setValue('version', plugin.version);
      setValue('type', plugin.type);
      setValue('category', plugin.category);
      setValue('minAppVersion', plugin.minAppVersion);
      setValue('maxAppVersion', plugin.maxAppVersion || '');
      setValue('trialDays', plugin.trialDays);
      setValue('tags', plugin.tags);
      setValue('permissions', plugin.permissions);
      setValue('dependencies', plugin.dependencies);
      setValue('pricing', plugin.pricing);
    }
  }, [mode, plugin, setValue]);
  
  if (mode === 'edit' && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }
  
  const onSubmit = async (data: PluginFormData) => {
    try {
      if (mode === 'create') {
        await createPlugin(data as CreatePluginDto);
      } else if (updatePlugin) {
        await updatePlugin(data as UpdatePluginDto);
        router.push(`/dashboard/plugins/${pluginId}`);
      }
    } catch (error) {
      // Error handling is done in the hooks
    }
  };
  
  const addTag = () => {
    if (currentTag.trim() && !watchedTags.includes(currentTag.trim())) {
      setValue('tags', [...watchedTags, currentTag.trim()]);
      setCurrentTag('');
    }
  };
  
  const removeTag = (tag: string) => {
    setValue('tags', watchedTags.filter(t => t !== tag));
  };
  
  const addPermission = () => {
    if (currentPermission.code && currentPermission.description) {
      setValue('permissions', [...watchedPermissions, { ...currentPermission }]);
      setCurrentPermission({ code: '', description: '', required: true });
    }
  };
  
  const removePermission = (index: number) => {
    setValue('permissions', watchedPermissions.filter((_, i) => i !== index));
  };
  
  const addDependency = () => {
    if (currentDependency.pluginName) {
      setValue('dependencies', [...watchedDependencies, { ...currentDependency }]);
      setCurrentDependency({ pluginName: '', minVersion: '', maxVersion: '' });
    }
  };
  
  const removeDependency = (index: number) => {
    setValue('dependencies', watchedDependencies.filter((_, i) => i !== index));
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'create' ? 'Create New Plugin' : 'Edit Plugin'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {mode === 'create' 
              ? 'Fill in the details to create your plugin'
              : 'Update your plugin information'
            }
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                General information about your plugin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Plugin Name</Label>
                  <Input
                    id="name"
                    placeholder="my-awesome-plugin"
                    {...register('name')}
                    disabled={mode === 'edit'}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                  {mode === 'edit' && (
                    <p className="text-sm text-muted-foreground">
                      Plugin name cannot be changed after creation
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="My Awesome Plugin"
                    {...register('displayName')}
                  />
                  {errors.displayName && (
                    <p className="text-sm text-red-600">{errors.displayName.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your plugin does..."
                  rows={3}
                  {...register('description')}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    placeholder="1.0.0"
                    {...register('version')}
                  />
                  {errors.version && (
                    <p className="text-sm text-red-600">{errors.version.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={watchedType} 
                    onValueChange={(value) => setValue('type', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PluginTypeIcons).map(([value, icon]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            {icon}
                            <span className="capitalize">{value}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="productivity"
                    {...register('category')}
                  />
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchedTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
              <CardDescription>
                Version compatibility and dependencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minAppVersion">Min App Version</Label>
                  <Input
                    id="minAppVersion"
                    placeholder="1.0.0"
                    {...register('minAppVersion')}
                  />
                  {errors.minAppVersion && (
                    <p className="text-sm text-red-600">{errors.minAppVersion.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxAppVersion">Max App Version (Optional)</Label>
                  <Input
                    id="maxAppVersion"
                    placeholder="2.0.0"
                    {...register('maxAppVersion')}
                  />
                  {errors.maxAppVersion && (
                    <p className="text-sm text-red-600">{errors.maxAppVersion.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Dependencies</Label>
                <div className="space-y-2">
                  <div className="grid gap-2 md:grid-cols-4">
                    <Input
                      placeholder="Plugin name"
                      value={currentDependency.pluginName}
                      onChange={(e) => setCurrentDependency({
                        ...currentDependency,
                        pluginName: e.target.value
                      })}
                    />
                    <Input
                      placeholder="Min version"
                      value={currentDependency.minVersion}
                      onChange={(e) => setCurrentDependency({
                        ...currentDependency,
                        minVersion: e.target.value
                      })}
                    />
                    <Input
                      placeholder="Max version"
                      value={currentDependency.maxVersion}
                      onChange={(e) => setCurrentDependency({
                        ...currentDependency,
                        maxVersion: e.target.value
                      })}
                    />
                    <Button type="button" onClick={addDependency} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  
                  {watchedDependencies.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {watchedDependencies.map((dep, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">
                            {dep.pluginName}
                            {dep.minVersion && ` (v${dep.minVersion}+)`}
                            {dep.maxVersion && ` - v${dep.maxVersion}`}
                          </span>
                          <Button
                            type="button"
                            onClick={() => removeDependency(index)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Required Permissions</CardTitle>
              <CardDescription>
                Specify the permissions your plugin needs to function
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Only request permissions that are absolutely necessary for your plugin to function.
                  Users are more likely to install plugins with fewer permission requirements.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <div className="grid gap-2 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <Input
                      placeholder="Permission code"
                      value={currentPermission.code}
                      onChange={(e) => setCurrentPermission({
                        ...currentPermission,
                        code: e.target.value
                      })}
                    />
                  </div>
                  <div className="md:col-span-6">
                    <Input
                      placeholder="Description"
                      value={currentPermission.description}
                      onChange={(e) => setCurrentPermission({
                        ...currentPermission,
                        description: e.target.value
                      })}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <Switch
                      checked={currentPermission.required}
                      onCheckedChange={(checked) => setCurrentPermission({
                        ...currentPermission,
                        required: checked
                      })}
                    />
                    <Label className="text-sm">Required</Label>
                  </div>
                  <div className="md:col-span-1">
                    <Button type="button" onClick={addPermission} variant="outline" className="w-full">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {watchedPermissions.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {watchedPermissions.map((perm, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">{perm.code}</code>
                            <Badge variant={perm.required ? 'destructive' : 'secondary'}>
                              {perm.required ? 'Required' : 'Optional'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{perm.description}</p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removePermission(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Monetization</CardTitle>
              <CardDescription>
                Configure pricing tiers for your plugin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trialDays">Free Trial Days</Label>
                <Input
                  id="trialDays"
                  type="number"
                  min="0"
                  max="365"
                  {...register('trialDays', { valueAsNumber: true })}
                />
                <p className="text-sm text-muted-foreground">
                  Number of days users can try your plugin for free (0 for no trial)
                </p>
              </div>
              
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  Detailed pricing configuration will be available after plugin creation.
                  You can set up different tiers with features and pricing.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/plugins')}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isCreating || isUpdatingPlugin}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {(isCreating || isUpdatingPlugin) && (
            <Package className="h-4 w-4 mr-2 animate-pulse" />
          )}
          {mode === 'create' ? 'Create Plugin' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};